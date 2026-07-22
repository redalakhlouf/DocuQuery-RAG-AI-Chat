# ROLE: Logique de traitement des documents
#
# ATTENDANCE SECURITY: On utilise SUPABASE_SERVICE_ROLE_KEY (bypass RLS).
# TOUTES les requêtes doivent impérativement filtrer par user_id.
# Si un seul filtre est oublié → faille de sécurité = un user voit les données d'un autre.
#
# - Upload le PDF dans Supabase Storage
# - Créer la metadata dans la table documents
# - Extraire le texte complet du PDF (PyMuPDF)
# - Découper en chunks (~500 mots, overlap 50 mots)
# - Gérer le statut: processing → ready / error
# - Gérer le TTL (expires_at = now + 1 heure)
#
# OPTIM MÉMOIRE:
# - extract_text_from_pdf traite page par page, pas full_text en mémoire
# - save_chunks_to_db embedde par micro-batch (16 chunks) et INSERT immédiat
# - download_from_storage permet au background task de ne pas garder contents[]
# - gc.collect() explicite après chaque grande opération

import gc
import uuid
import re
import logging
import fitz
from datetime import datetime, timedelta, timezone
from supabase import create_client
from app.core.config import settings
from app.services.embedding_service import generate_embeddings_batch

logger = logging.getLogger(__name__)

# SECURITY: Service role key bypass RLS — chaque requête DOIT filtrer par user_id
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def upload_to_supabase(user_id: str, document_id: str, contents: bytes) -> str:
    storage_path = f"{user_id}/{document_id}.pdf"
    supabase.storage.from_("documents").upload(storage_path, contents)
    return storage_path


def download_from_storage(storage_path: str) -> bytes:
    """Télécharge le PDF depuis Supabase Storage (utilisé par le background task
    pour ne pas garder contents[] en mémoire dans la closure BackgroundTasks)."""
    response = supabase.storage.from_("documents").download(storage_path)
    return response


def sanitize_filename(filename: str) -> str:
    name = re.sub(r'[^\w\s\-.]', '', filename)
    name = re.sub(r'\s+', '_', name)
    if not name or len(name) > 255:
        name = "document.pdf"
    return name


def create_document_in_db(
    document_id: str,
    user_id: str,
    filename: str,
    storage_path: str
) -> dict:
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    supabase.table("documents").insert({
        "id": document_id,
        "user_id": user_id,
        "filename": filename,
        "storage_path": storage_path,
        "status": "pending",
        "expires_at": expires_at
    }).execute()
    return {
        "document_id": document_id,
        "filename": filename,
        "status": "pending"
    }


def extract_text_from_pdf(contents: bytes) -> tuple[str, list[tuple]]:
    """Extraction classique — gardée pour compatibilité / tests.
    Pour le traitement production, utiliser extract_and_chunk_pdf()."""
    doc = fitz.open(stream=contents, filetype="pdf")
    full_text = ""
    page_map = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        page_map.append((len(full_text), page_num + 1))
        full_text += page.get_text() + " "

    doc.close()
    del doc
    gc.collect()
    return full_text, page_map


def get_page_number(position: int, page_map: list[tuple]) -> int:
    page_number = 1
    for pos, p_num in page_map:
        if pos <= position:
            page_number = p_num
    return page_number


def chunk_text(full_text: str, page_map: list[tuple], chunk_size: int = 500, overlap: int = 50) -> list[dict]:
    words = full_text.split()
    chunks = []
    start = 0

    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk_words = words[start:end]
        chunk_content = " ".join(chunk_words)
        word_start_char = len(" ".join(words[:start]))
        page_number = get_page_number(word_start_char, page_map)

        chunks.append({
            "content": chunk_content,
            "page_number": page_number,
            "word_start": start,
            "word_end": end
        })

        start += chunk_size - overlap

    return chunks


def extract_and_chunk_pdf(contents: bytes, chunk_size: int = 500, overlap: int = 50) -> list[dict]:
    """Extrait le texte page par page et crée les chunks directement.
    Évite de garder full_text complet en mémoire : accumulate page par page."""
    doc = fitz.open(stream=contents, filetype="pdf")
    chunks = []

    # Accumulateur de texte pour gérer le chevauchement entre pages
    carry_over_words: list[str] = []
    global_char_offset = 0

    for page_num in range(len(doc)):
        page = doc[page_num]
        page_text = page.get_text()
        page_words = page_text.split()

        # Libérer la page dès qu'on a le texte
        del page_text

        # Comb carry-over de la page précédente + texte de cette page
        all_words = carry_over_words + page_words
        del page_words

        # Découper en chunks de chunk_size mots
        start = 0
        while start + chunk_size <= len(all_words):
            chunk_words = all_words[start:start + chunk_size]
            chunk_content = " ".join(chunk_words)

            # Calculer le numéro de page basé sur la position globale
            page_number = page_num + 1

            chunks.append({
                "content": chunk_content,
                "page_number": page_number,
                "word_start": global_char_offset + start,
                "word_end": global_char_offset + start + chunk_size
            })

            start += chunk_size - overlap

        # Garder les derniers mots comme carry-over pour la prochaine page
        carry_over_words = all_words[start:] if start < len(all_words) else []
        global_char_offset += len(all_words)

    # Dernier chunk avec le reste s'il est significatif (>20% du chunk_size)
    if len(carry_over_words) > chunk_size * 0.2:
        chunk_content = " ".join(carry_over_words)
        chunks.append({
            "content": chunk_content,
            "page_number": len(doc),
            "word_start": global_char_offset - len(carry_over_words),
            "word_end": global_char_offset
        })

    doc.close()
    del doc
    gc.collect()

    logger.info("PDF chunké en %d chunks (chunk_size=%d, overlap=%d)", len(chunks), chunk_size, overlap)
    return chunks


def save_chunks_to_db(document_id: str, chunks: list[dict]) -> int:
    """Sauvegarde les chunks avec embeddings par micro-batch.
    Chaque batch est INSERTé puis libéré de la mémoire immédiatement."""
    EMBED_BATCH_SIZE = 16
    DB_BATCH_SIZE = 50
    total_saved = 0

    # Traiter les embeddings par micro-batch
    for i in range(0, len(chunks), EMBED_BATCH_SIZE):
        batch_chunks = chunks[i:i + EMBED_BATCH_SIZE]
        texts = [c["content"] for c in batch_chunks]

        # Générer les embeddings pour ce micro-batch
        embeddings = generate_embeddings_batch(texts, batch_size=EMBED_BATCH_SIZE)

        # Construire les rows pour ce micro-batch
        rows = [{
            "id": str(uuid.uuid4()),
            "document_id": document_id,
            "content": c["content"],
            "embedding": str(e),
            "page_number": c["page_number"]
        } for c, e in zip(batch_chunks, embeddings)]

        # Libérer les embeddings intermédiaires
        del embeddings
        del texts
        gc.collect()

        # INSERT en sous-batches dans la DB
        for j in range(0, len(rows), DB_BATCH_SIZE):
            db_batch = rows[j:j + DB_BATCH_SIZE]
            supabase.table("chunks").insert(db_batch).execute()
            total_saved += len(db_batch)

        # Libérer les rows
        del rows
        gc.collect()

    return total_saved


def update_document_status(document_id: str, status: str, user_id: str):
    supabase.table("documents").update({"status": status}).eq("id", document_id).eq("user_id", user_id).execute()


def get_document_by_id(document_id: str, user_id: str) -> dict | None:
    result = supabase.table("documents").select("*").eq("id", document_id).eq("user_id", user_id).execute()
    if result.data:
        return result.data[0]
    return None


def list_user_documents(user_id: str) -> list[dict]:
    result = supabase.table("documents").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return result.data if result.data else []


def find_duplicate_document(user_id: str, filename: str) -> dict | None:
    result = (
        supabase.table("documents")
        .select("*")
        .eq("user_id", user_id)
        .eq("filename", filename)
        .eq("status", "ready")
        .execute()
    )
    if result.data:
        return result.data[0]
    return None


def count_user_documents(user_id: str) -> int:
    result = (
        supabase.table("documents")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .execute()
    )
    return result.count or 0


def delete_document(user_id: str, document_id: str) -> bool:
    doc = get_document_by_id(document_id)
    if not doc or doc["user_id"] != user_id:
        return False

    # 1. Supprimer les chunks de la table document_chunks
    supabase.table("document_chunks").delete().eq("document_id", document_id).execute()

    # 2. Supprimer le fichier du Storage
    if doc.get("storage_path"):
        try:
            supabase.storage.from_("documents").remove([doc["storage_path"]])
        except Exception:
            pass

    # 3. Supprimer le document de la table documents
    supabase.table("documents").delete().eq("id", document_id).execute()

    return True
