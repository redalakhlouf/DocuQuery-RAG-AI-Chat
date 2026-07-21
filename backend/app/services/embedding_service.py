# ROLE: Génération des embeddings
#
# - Charger le modèle multilingual-e5-small (sentence-transformers)
# - Transformer un texte en vecteur de dimension 384
# - Transformer la question de l'utilisateur en vecteur
#
# Note: le modèle tourne sur le backend (pas d'API externe).
# ~300 MB RAM utilisés.
#
# Le modèle est chargé au démarrage du serveur (via load_model() appelé
# dans le lifespan FastAPI) pour que le readiness probe Azure n'arrive
# pas avant que le modèle soit prêt. Le singleton est conservé.

import logging
import threading

from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

_model: SentenceTransformer | None = None
_model_lock = threading.Lock()


def load_model() -> None:
    """Charge le modèle au démarrage du serveur. Thread-safe, idempotent."""
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                logger.info("Chargement du modèle d'embeddings...")
                _model = SentenceTransformer("intfloat/multilingual-e5-small")
                logger.info("Modèle d'embeddings chargé avec succès.")


def get_model() -> SentenceTransformer:
    """Retourne l'instance singleton. Charge si pas encore chargé (safety net)."""
    if _model is None:
        load_model()
    return _model


def generate_embedding(text: str) -> list[float]:
    model = get_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


def generate_embeddings_batch(texts: list[str], batch_size: int = 16) -> list[list[float]]:
    model = get_model()
    vectors = model.encode(texts, normalize_embeddings=True, batch_size=batch_size)
    return [v.tolist() for v in vectors]
