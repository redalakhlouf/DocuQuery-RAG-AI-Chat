import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.services.embedding_service import generate_embedding


class RetrievalService:
    """
    Service de recherche vectorielle (coeur du RAG).
    
    Quand un utilisateur pose une question :
    1. On transforme la question en vecteur (embedding)
    2. On cherche dans pgvector les chunks les plus proches
    3. On filtre par user_id ET document_id
    4. On applique un seuil minimum de pertinence
    5. On retourne les k meilleurs chunks
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def retrieve(
        self,
        question: str,
        user_id: str,
        document_id: str,
        k: int = 5,
        similarity_threshold: float = 0.5
    ) -> list[dict]:
        """
        Recherche les k chunks les plus pertinents pour répondre à la question.
        
        Args:
            question: La question de l'utilisateur
            user_id: L'ID de l'utilisateur (pour la sécurité)
            document_id: L'ID du document (pour la sécurité)
            k: Nombre de chunks à retourner (défaut: 5)
            similarity_threshold: Score minimum de pertinence (défaut: 0.5)
            
        Returns:
            Liste de dictionnaires avec les chunks pertinents
        """

        # ─── ÉTAPE 1 : Transformer la question en vecteur ───
        # generate_embedding transforme le texte en vecteur numpy (384 dimensions)
        # Utilisation de to_thread pour ne pas bloquer l'event loop
        question_embedding = await asyncio.to_thread(generate_embedding, question)

        # Convertir le vecteur numpy en string pour pgvector
        # Format attendu : "[0.12,-0.34,0.56,...]"
        embedding_str = "[" + ",".join(str(x) for x in question_embedding) + "]"

        # ─── ÉTAPE 2 : Requête pgvector ───
        # L'opérateur <=> calcule la distance cosine entre deux vecteurs
        # - 0 = vecteurs identiques
        # - 1 = vecteurs opposés
        # On inverse : 1 - distance = score de similarité (plus c'est haut, plus c'est pertinent)
        query = text("""
            SELECT
                c.id,
                c.content,
                c.page_number,
                1 - (c.embedding <=> CAST(:embedding AS vector)) AS similarity
            FROM chunks c
            JOIN documents d ON c.document_id = d.id
            WHERE c.document_id = :document_id
              AND d.user_id = :user_id
              AND 1 - (c.embedding <=> CAST(:embedding AS vector)) > :threshold
            ORDER BY c.embedding <=> CAST(:embedding AS vector)
            LIMIT :k
        """)

        # ─── ÉTAPE 3 : Exécuter la requête ───
        result = await self.db.execute(query, {
            "embedding": embedding_str,
            "document_id": document_id,
            "user_id": user_id,
            "threshold": similarity_threshold,
            "k": k
        })

        # ─── ÉTAPE 4 : Convertir les résultats ───
        rows = result.mappings().all()
        return [
            {
                "chunk_id": str(row["id"]),
                "content": row["content"],
                "page_number": row["page_number"],
                "similarity": round(float(row["similarity"]), 4)
            }
            for row in rows
        ]
