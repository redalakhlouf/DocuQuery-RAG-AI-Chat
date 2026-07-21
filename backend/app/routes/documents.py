# ROLE: Routes de gestion des documents
#
# POST /api/v1/documents/upload     - Upload un PDF
# GET  /api/v1/documents            - Lister les documents de l'utilisateur
# GET  /api/v1/documents/{id}/status - Vérifier le statut de traitement
#
# Toutes les routes sont protégées par get_current_user (JWT).
#
# OPTIM MÉMOIRE:
# - contents[] n'est PAS passé au BackgroundTask (évite la closure en RAM)
# - Le background task télécharge le PDF depuis Supabase Storage
# - extract_and_chunk_pdf traite page par page
# - gc.collect() après libération de contents
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
import gc
import uuid
import logging
try:
    import magic
except (ImportError, OSError):
    magic = None
from app.core.security import get_current_user
from app.core.config import settings
from app.services.document_service import (
    upload_to_supabase, create_document_in_db, extract_and_chunk_pdf,
    save_chunks_to_db, update_document_status,
    get_document_by_id, list_user_documents, sanitize_filename
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


def _process_document(document_id: str, user_id: str, storage_path: str):
    """Background task: télécharge le PDF depuis Storage, traite, et nettoie.
    Ne reçoit PAS contents[] en paramètre pour éviter de garder le binaire en RAM."""
    try:
        # Télécharger le PDF depuis Supabase Storage (au lieu de le garder en closure)
        from app.services.document_service import download_from_storage
        contents = download_from_storage(storage_path)

        # Traiter page par page, tout en mémoire minimale
        chunks = extract_and_chunk_pdf(contents)

        # Libérer le binaire dès qu'on a les chunks
        del contents
        gc.collect()

        # Sauvegarder chunks + embeddings par micro-batch
        save_chunks_to_db(document_id, chunks)

        # Libérer les chunks
        del chunks
        gc.collect()

        update_document_status(document_id, "ready", user_id)
        logger.info("Document %s processed successfully", document_id)
    except Exception as e:
        logger.exception("Background processing failed for document %s", document_id)
        update_document_status(document_id, "error", user_id)


@router.get('/')
def list_documents(user_id: str = Depends(get_current_user)):
    docs = list_user_documents(user_id)
    return {"user_id": user_id, "documents": docs}


@router.post('/upload')
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    document_id = str(uuid.uuid4())
    try:
        contents = await file.read()

        if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"Fichier trop volumineux (max {settings.MAX_FILE_SIZE_MB} Mo)"
            )

        if magic is not None:
            mime_type = magic.from_buffer(contents, mime=True)
            if mime_type not in settings.ALLOWED_MIME_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail="Type de fichier non autorisé"
                )
        else:
            if not (file.filename and file.filename.lower().endswith('.pdf')):
                raise HTTPException(
                    status_code=400,
                    detail="Type de fichier non autorisé (pdf uniquement)"
                )

        storage_path = upload_to_supabase(user_id, document_id, contents)

        safe_filename = sanitize_filename(file.filename or "document.pdf")
        create_document_in_db(
            document_id=document_id,
            user_id=user_id,
            filename=safe_filename,
            storage_path=storage_path
        )

        # Libérer les bytes du PDF AVANT de lancer le background task.
        # Le background task téléchargera depuis Storage quand il en aura besoin.
        del contents
        gc.collect()

        # Passer storage_path (string) au lieu de contents (bytes) pour éviter
        # de garder le binaire en mémoire dans la closure BackgroundTasks.
        background_tasks.add_task(_process_document, document_id, user_id, storage_path)

        return {
            "document_id": document_id,
            "filename": safe_filename,
            "status": "processing",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Upload failed for document %s", document_id)
        update_document_status(document_id, "error", user_id)
        raise HTTPException(
            status_code=500,
            detail="Erreur lors du traitement du document. Veuillez réessayer."
        )


@router.get('/{document_id}/status')
def get_document_status(
    document_id: str,
    user_id: str = Depends(get_current_user)
):
    document = get_document_by_id(document_id, user_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    return {
        "document_id": document["id"],
        "status": document["status"],
        "filename": document["filename"],
        "created_at": document["created_at"]
    }
