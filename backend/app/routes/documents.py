# ROLE: Routes de gestion des documents
#
# POST /api/v1/documents/upload     - Upload un PDF
# GET  /api/v1/documents            - Lister les documents de l'utilisateur
# GET  /api/v1/documents/{id}/status - Vérifier le statut de traitement
# DELETE /api/v1/documents/{id}     - Supprimer un document
#
# Toutes les routes sont protégées par get_current_user (JWT).
# Sera implémenté en Phase 5 (upload & ingestion).
