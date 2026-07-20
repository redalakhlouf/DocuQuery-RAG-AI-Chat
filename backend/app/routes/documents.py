# ROLE: Routes de gestion des documents
#
# POST /api/v1/documents/upload     - Upload un PDF
# GET  /api/v1/documents            - Lister les documents de l'utilisateur
# GET  /api/v1/documents/{id}/status - Vérifier le statut de traitement
# DELETE /api/v1/documents/{id}     - Supprimer un document
#
# Toutes les routes sont protégées par get_current_user (JWT).
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
import uuid
import logging
try:
    import magic
except (ImportError, OSError):
    magic = None
from app.core.security import get_current_user
from app.core.config import settings
from app.services.document_service import (
    upload_to_supabase, create_document_in_db, extract_text_from_pdf,
    chunk_text, save_chunks_to_db, update_document_status,
    get_document_by_id, list_user_documents, sanitize_filename
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


def _process_document(document_id: str, user_id: str, contents: bytes):
    try:
        full_text, page_map = extract_text_from_pdf(contents)
        chunks = chunk_text(full_text, page_map)
        save_chunks_to_db(document_id, chunks)
        update_document_status(document_id, "ready", user_id)
        logger.info("Document %s processed successfully (%d chunks)", document_id, len(chunks))
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

        background_tasks.add_task(_process_document, document_id, user_id, contents)

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

