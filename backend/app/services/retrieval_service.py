# ROLE: Recherche vectorielle (coeur du RAG)
#
# - Prendre le vecteur de la question
# - Rechercher les k chunks les plus similaires dans pgvector
# - Filtrer par document_id ET user_id (double sécurité)
# - Retourner les chunks avec leur score de similarité
# - Appliquer un seuil minimum de pertinence
#
# Sera implémenté en Phase 6 (retrieval).
