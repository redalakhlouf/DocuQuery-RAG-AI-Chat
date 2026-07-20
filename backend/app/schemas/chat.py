import re
from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000, description="Question de l'utilisateur")
    conversation_id: str = Field(..., description="ID de la conversation (UUID)")

    @field_validator("conversation_id")
    @classmethod
    def validate_conversation_id(cls, v: str) -> str:
        """SECURITY: Valider que le conversation_id est un UUID valide."""
        uuid_pattern = re.compile(
            r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
            re.IGNORECASE
        )
        if not uuid_pattern.match(v):
            raise ValueError("conversation_id doit être un UUID valide")
        return v


class SourceResult(BaseModel):
    page: int
    content: str
    similarity: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceResult]
    conversation_id: str
