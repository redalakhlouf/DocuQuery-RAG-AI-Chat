# ROLE: Logique de traitement des documents
#
# - Valider le PDF (taille max 5 MB, type MIME réel)
# - Extraire le texte page par page (PyMuPDF)
# - Découper en chunks (~500 mots, overlap 50 mots)
# - Gérer le statut: processing → ready / error
# - Gérer le TTL (expires_at = now + 1 heure)
#
# Sera implémenté en Phase 5 (upload & ingestion).
