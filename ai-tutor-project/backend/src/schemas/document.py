import uuid
from datetime import datetime

from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: uuid.UUID
    file_name: str
    file_type: str
    size_bytes: int
    status: str
    page_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class AskRequest(BaseModel):
    document_id: uuid.UUID
    question: str
    conversation_id: uuid.UUID | None = None


class SourceChunk(BaseModel):
    page: int | None = None
    snippet: str


class AskResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    response_time_ms: int
