from datetime import datetime, timezone

from beanie import Document as BeanieDocument
from pydantic import Field


class Conversation(BeanieDocument):
    user_id: str
    document_id: str
    title: str = "Cuộc trò chuyện mới"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "conversations"
        indexes = ["user_id", "document_id"]
