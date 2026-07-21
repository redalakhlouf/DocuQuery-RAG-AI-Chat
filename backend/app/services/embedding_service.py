# ROLE: Génération des embeddings
#
# - Charger le modèle multilingual-e5-small (sentence-transformers)
# - Transformer un texte en vecteur de dimension 384
# - Transformer la question de l'utilisateur en vecteur
#
# Note: le modèle tourne sur le backend (pas d'API externe).
# ~300 MB RAM utilisés.
#
# OPTIM: Lazy loading singleton thread-safe — le modèle n'est chargé qu'à
# la première utilisation réelle, pas au démarrage du serveur.
# Ceci réduit la RAM idle de ~300 MB.

import gc
import logging
import threading

from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

_model: SentenceTransformer | None = None
_model_lock = threading.Lock()


def get_model() -> SentenceTransformer:
    """Retourne l'instance singleton du modèle, chargée à la première utilisation."""
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                logger.info("Chargement du modèle d'embeddings (première requête)...")
                _model = SentenceTransformer("intfloat/multilingual-e5-small")
                logger.info("Modèle chargé.")
    return _model


def generate_embedding(text: str) -> list[float]:
    model = get_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


def generate_embeddings_batch(texts: list[str], batch_size: int = 16) -> list[list[float]]:
    model = get_model()
    vectors = model.encode(texts, normalize_embeddings=True, batch_size=batch_size)
    return [v.tolist() for v in vectors]
