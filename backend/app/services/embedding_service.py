# ROLE: Génération des embeddings
#
# - Charger le modèle multilingual-e5-small (sentence-transformers)
# - Transformer un texte en vecteur de dimension 384
# - Transformer la question de l'utilisateur en vecteur
#
# Note: le modèle tourne sur le backend (pas d'API externe).
# ~300 MB RAM utilisés.

from sentence_transformers import SentenceTransformer

_model = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("intfloat/multilingual-e5-small")
    return _model


def generate_embedding(text: str) -> list[float]:
    model = get_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()
