from datetime import datetime, timezone

from beanie import Document as BeanieDocument
from pydantic import Field


class Message(BeanieDocument):
    conversation_id: str
    role: str  # user | assistant
    content: str
    sources: str | None = None  # JSON string: trích dẫn nguồn
    response_time_ms: int | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "messages"
        indexes = ["conversation_id"]
