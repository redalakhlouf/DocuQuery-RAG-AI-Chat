# ROLE: Logique de traitement des documents
#
# - Upload le PDF dans Supabase Storage
# - Créer la metadata dans la table documents
# - Extraire le texte complet du PDF (PyMuPDF)
# - Découper en chunks (~500 mots, overlap 50 mots)
# - Gérer le statut: processing → ready / error
# - Gérer le TTL (expires_at = now + 1 heure)

import uuid
import fitz
from datetime import datetime, timedelta
from supabase import create_client
from app.core.config import settings
from app.services.embedding_service import generate_embedding

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def upload_to_supabase(user_id: str, document_id: str, contents: bytes) -> str:
    storage_path = f"{user_id}/{document_id}.pdf"
    supabase.storage.from_("documents").upload(storage_path, contents)
    return storage_path


def create_document_in_db(
    document_id: str,
    user_id: str,
    filename: str,
    storage_path: str
) -> dict:
    expires_at = (datetime.utcnow() + timedelta(hours=1)).isoformat()
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
    doc = fitz.open(stream=contents, filetype="pdf")
    full_text = ""
    page_map = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        page_map.append((len(full_text), page_num + 1))
        full_text += page.get_text() + " "

    doc.close()
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
        end = start + chunk_size
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


def save_chunks_to_db(document_id: str, chunks: list[dict]) -> int:
    rows = []
    for chunk in chunks:
        embedding = generate_embedding(chunk["content"])
        rows.append({
            "id": str(uuid.uuid4()),
            "document_id": document_id,
            "content": chunk["content"],
            "embedding": str(embedding),
            "page_number": chunk["page_number"]
        })

    for row in rows:
        supabase.table("chunks").insert(row).execute()

    return len(rows)


def update_document_status(document_id: str, status: str):
    supabase.table("documents").update({"status": status}).eq("id", document_id).execute()


def get_document_by_id(document_id: str, user_id: str) -> dict | None:
    result = supabase.table("documents").select("*").eq("id", document_id).eq("user_id", user_id).execute()
    if result.data:
        return result.data[0]
    return None
