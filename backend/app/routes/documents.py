# ROLE: Routes de gestion des documents
#
# POST /api/v1/documents/upload     - Upload un PDF
# GET  /api/v1/documents            - Lister les documents de l'utilisateur
# GET  /api/v1/documents/{id}/status - Vérifier le statut de traitement
# DELETE /api/v1/documents/{id}     - Supprimer un document
#
# Toutes les routes sont protégées par get_current_user (JWT).
# Sera implémenté en Phase 5 (upload & ingestion).
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
import uuid
import magic
from app.core.security import get_current_user
from app.core.config import settings
from app.services.document_service import upload_to_supabase, create_document_in_db, extract_text_from_pdf, chunk_text, save_chunks_to_db, update_document_status, get_document_by_id

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


@router.get('/')
def list_documents(user_id: str = Depends(get_current_user)):
    return {"user_id": user_id, "documents": []}


@router.post('/upload')
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    # 1. Lire le fichier
    contents = await file.read()

    # 2. Vérifier la taille
    if len(contents) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"Fichier trop volumineux (max {settings.MAX_FILE_SIZE_MB} Mo)"
        )

    # 3. Vérifier le MIME réel
    mime_type = magic.from_buffer(contents, mime=True)
    if mime_type not in settings.ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Type de fichier non autorisé : {mime_type}"
        )

    # 4. Générer un ID unique pour ce document
    document_id = str(uuid.uuid4())

    # 5. Envoyer le fichier dans Supabase Storage
    storage_path = upload_to_supabase(user_id, document_id, contents)

    # 6. Créer la metadata dans la table documents
    result = create_document_in_db(
        document_id=document_id,
        user_id=user_id,
        filename=file.filename,
        storage_path=storage_path
    )

    # 7. Extraire le texte du PDF
    full_text, page_map = extract_text_from_pdf(contents)

    # 8. Découper en chunks
    chunks = chunk_text(full_text, page_map)

    # 9. Générer les embeddings et sauvegarder dans la DB
    chunks_saved = save_chunks_to_db(document_id, chunks)

    # 10. Mettre à jour le statut : pending → ready
    update_document_status(document_id, "ready")

    # 11. Retourner la confirmation
    return {
        "document_id": document_id,
        "filename": file.filename,
        "status": "ready",
        "text_length": len(full_text),
        "pages_found": len(page_map),
        "chunks_saved": chunks_saved
    }


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

