from datetime import datetime, timezone

from beanie import Document as BeanieDocument
from pydantic import Field


class Document(BeanieDocument):
    owner_id: str  # str(User.id)
    file_name: str
    file_path: str
    file_type: str  # pdf | docx | xlsx
    size_bytes: int = 0
    status: str = "processing"  # processing | indexed | failed
    page_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "documents"
        indexes = ["owner_id"]
