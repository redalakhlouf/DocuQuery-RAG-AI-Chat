import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.retrieval_service import RetrievalService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/retrieval", tags=["retrieval"])


class SearchRequest(BaseModel):
    question: str
    document_id: str
    k: int = 5


class ChunkResult(BaseModel):
    chunk_id: str
    content: str
    page_number: int
    similarity: float


class SearchResponse(BaseModel):
    chunks: list[ChunkResult]
    question: str


@router.post("/search", response_model=SearchResponse)
async def search_chunks(
    request: SearchRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        service = RetrievalService(db)
        chunks = await service.retrieve(
            question=request.question,
            user_id=user,
            document_id=request.document_id,
            k=request.k
        )

        return SearchResponse(
            chunks=[
                ChunkResult(
                    chunk_id=c["chunk_id"],
                    content=c["content"],
                    page_number=c["page_number"],
                    similarity=c["similarity"]
                )
                for c in chunks
            ],
            question=request.question
        )
    except Exception as e:
        logger.exception("Retrieval search failed")
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de la recherche. Veuillez réessayer."
        )
