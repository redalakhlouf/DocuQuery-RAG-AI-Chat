# ROLE: Routes de chat / RAG
#
# POST /api/v1/chat/query                - Poser une question sur un document
# GET  /api/v1/chat/conversations        - Lister les conversations
# GET  /api/v1/chat/conversations/{id}/messages - Historique d'une conversation
#
# Protégées par get_current_user + rate limiting (30 questions/jour).
# Sera implémenté en Phase 6 (retrieval) + Phase 8 (génération).
