# ROLE: Routes de chat / RAG
#
# POST /api/v1/chat/query                - Poser une question sur un document
# GET  /api/v1/chat/conversations        - Lister les conversations
# POST /api/v1/chat/conversations        - Créer une conversation
# GET  /api/v1/chat/conversations/{id}/messages - Historique d'une conversation
#
# Protégées par get_current_user (JWT Supabase).
# Rate limiting: 30 questions/jour/utilisateur (table usage).

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.chat_service import chat_service
from app.services.retrieval_service import RetrievalService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])

DAILY_QUESTION_LIMIT = 30


# ─── Request / Response models ────────────────────────────────────────

class CreateConversationRequest(BaseModel):
    document_id: str


class QueryRequest(BaseModel):
    question: str
    conversation_id: str


# ─── Helpers ──────────────────────────────────────────────────────────

async def _verify_document_ownership(
    db: AsyncSession, document_id: str, user_id: str
) -> dict:
    """Vérifie que le document appartient à l'utilisateur. Retourne le doc ou lève 404."""
    result = await db.execute(
        text("SELECT id, status FROM documents WHERE id = :doc_id AND user_id = :uid"),
        {"doc_id": document_id, "uid": user_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    return dict(row)


async def _verify_conversation_ownership(
    db: AsyncSession, conversation_id: str, user_id: str
) -> dict:
    """Vérifie que la conversation appartient à l'utilisateur. Retourne la conv ou lève 404."""
    result = await db.execute(
        text(
            "SELECT id, document_id, created_at "
            "FROM conversations WHERE id = :conv_id AND user_id = :uid"
        ),
        {"conv_id": conversation_id, "uid": user_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    return dict(row)


async def _check_rate_limit(db: AsyncSession, user_id: str) -> None:
    """Vérifie le quota quotidien. Lève 429 si la limite est atteinte."""
    today = datetime.now(timezone.utc).date()
    result = await db.execute(
        text(
            "SELECT questions_count FROM usage "
            "WHERE user_id = :uid AND date = :today"
        ),
        {"uid": user_id, "today": today},
    )
    row = result.mappings().first()
    if row and row["questions_count"] >= DAILY_QUESTION_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Limite de {DAILY_QUESTION_LIMIT} questions/jour atteinte. Réessayez demain.",
        )


async def _increment_usage(db: AsyncSession, user_id: str) -> None:
    """Incrémente le compteur de questions (UPSERT)."""
    today = datetime.now(timezone.utc).date()
    await db.execute(
        text(
            "INSERT INTO usage (user_id, date, questions_count) "
            "VALUES (:uid, :today, 1) "
            "ON CONFLICT (user_id, date) DO UPDATE SET questions_count = usage.questions_count + 1"
        ),
        {"uid": user_id, "today": today},
    )
    await db.commit()


def _build_rag_prompt(question: str, chunks: list[dict]) -> str:
    """Construit le prompt RAG avec le contexte trouvé (ou un message d'absence de contexte)."""
    context_parts = []
    for c in chunks:
        context_parts.append(f"[chunk - page {c['page_number']}]\n{c['content']}")
    context_block = "\n\n".join(context_parts) if context_parts else "(Aucun contexte pertinent trouvé dans le document.)"

    return (
        "Tu es DocuQuery, un assistant QA. Réponds à la question en te basant "
        "UNIQUEMENT sur le contexte suivant.\n\n"
        f"CONTEXTE:\n{context_block}\n\n"
        f"QUESTION: {question}\n\n"
        "Si le contexte ne contient pas la réponse, dis-le honnêtement."
    )


# ─── Endpoints ────────────────────────────────────────────────────────

@router.post("/conversations")
async def create_conversation(
    body: CreateConversationRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await _verify_document_ownership(db, body.document_id, user_id)

        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(hours=2)

        result = await db.execute(
            text(
                "INSERT INTO conversations (user_id, document_id, expires_at, created_at) "
                "VALUES (:uid, :doc_id, :expires_at, :now) "
                "RETURNING id, created_at"
            ),
            {"uid": user_id, "doc_id": body.document_id, "expires_at": expires_at, "now": now},
        )
        await db.commit()
        row = result.mappings().first()

        return {
            "conversation_id": str(row["id"]),
            "created_at": row["created_at"].isoformat(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to create conversation")
        raise HTTPException(status_code=500, detail="Erreur lors de la création de la conversation")


@router.get("/conversations/")
async def list_conversations(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await db.execute(
            text(
                "SELECT id, document_id, created_at "
                "FROM conversations WHERE user_id = :uid "
                "ORDER BY created_at DESC"
            ),
            {"uid": user_id},
        )
        rows = result.mappings().all()

        return {
            "conversations": [
                {
                    "id": str(r["id"]),
                    "document_id": str(r["document_id"]),
                    "created_at": r["created_at"].isoformat(),
                }
                for r in rows
            ]
        }

    except Exception as e:
        logger.exception("Failed to list conversations")
        raise HTTPException(status_code=500, detail="Erreur lors du chargement des conversations")


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await _verify_conversation_ownership(db, conversation_id, user_id)

        result = await db.execute(
            text(
                "SELECT role, content, created_at "
                "FROM messages WHERE conversation_id = :conv_id "
                "ORDER BY created_at ASC"
            ),
            {"conv_id": conversation_id},
        )
        rows = result.mappings().all()

        return {
            "messages": [
                {
                    "role": r["role"],
                    "content": r["content"],
                    "created_at": r["created_at"].isoformat(),
                }
                for r in rows
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to get messages")
        raise HTTPException(status_code=500, detail="Erreur lors du chargement des messages")


@router.post("/query")
async def chat_query(
    body: QueryRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        # 1. Valider la conversation et récupérer le document_id
        conv = await _verify_conversation_ownership(db, body.conversation_id, user_id)
        document_id = str(conv["document_id"])

        # 2. Rate limiting (AVANT tout traitement coûteux)
        await _check_rate_limit(db, user_id)

        # 3. Retrieval des chunks pertinents (inclut l'embedding de la question en interne)
        retrieval = RetrievalService(db)
        chunks = await retrieval.retrieve(
            question=body.question,
            user_id=user_id,
            document_id=document_id,
            k=5,
            similarity_threshold=0.5,
        )

        # 4. Construire le prompt et appeler le LLM
        prompt = _build_rag_prompt(body.question, chunks)
        answer = await chat_service.call_llm(prompt)

        # 5. Sauvegarder les deux messages
        now = datetime.now(timezone.utc)
        await db.execute(
            text(
                "INSERT INTO messages (conversation_id, role, content, created_at) "
                "VALUES (:conv_id, 'user', :content, :now)"
            ),
            {"conv_id": body.conversation_id, "content": body.question, "now": now},
        )
        await db.execute(
            text(
                "INSERT INTO messages (conversation_id, role, content, created_at) "
                "VALUES (:conv_id, 'assistant', :content, :now)"
            ),
            {"conv_id": body.conversation_id, "content": answer, "now": now},
        )
        await db.commit()

        # 6. Incrémenter le compteur d'usage
        await _increment_usage(db, user_id)

        # 7. Retourner la réponse au format attendu par le frontend
        sources = [
            {"page": c["page_number"], "similarity": c["similarity"]}
            for c in chunks
        ]

        return {"answer": answer, "sources": sources}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Chat query failed")
        raise HTTPException(status_code=500, detail="Erreur lors de la génération de la réponse")
