from datetime import datetime, timezone

from beanie import Document as BeanieDocument
from beanie import Indexed
from pydantic import Field


class User(BeanieDocument):
    full_name: str
    email: Indexed(str, unique=True)
    hashed_password: str
    role: str = "student"  # student | admin
    avatar_url: str | None = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
