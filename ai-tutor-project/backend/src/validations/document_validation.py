from datetime import datetime

from beanie import PydanticObjectId
from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: PydanticObjectId
    file_name: str
    file_type: str
    size_bytes: int
    status: str
    page_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class AskRequest(BaseModel):
    document_id: PydanticObjectId
    question: str
    conversation_id: PydanticObjectId | None = None


class SourceChunk(BaseModel):
    page: int | None = None
    snippet: str


class AskResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    response_time_ms: int
    conversation_id: str | None = None


class CreateConversation(BaseModel):
    document_id: PydanticObjectId
    title: str = "Cuộc trò chuyện mới"


class ConversationOut(BaseModel):
    id: PydanticObjectId
    document_id: str
    title: str
    created_at: datetime

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: PydanticObjectId
    conversation_id: str
    role: str
    content: str
    sources: str | None = None
    response_time_ms: int | None = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Admin ----------

class AdminDocumentOut(BaseModel):
    id: PydanticObjectId
    file_name: str
    file_type: str
    size_bytes: int
    status: str
    page_count: int
    owner_id: str
    owner_name: str = ""
    created_at: datetime

    class Config:
        from_attributes = True


class AdminQueryLog(BaseModel):
    time: str
    user_name: str
    question: str
    document_name: str
    latency: str
    status: str
