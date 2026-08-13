from datetime import datetime

from beanie import PydanticObjectId
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: PydanticObjectId
    full_name: str
    email: EmailStr
    role: str
    avatar_url: str | None = None

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Profile ----------

class UpdateProfile(BaseModel):
    full_name: str


class ChangePassword(BaseModel):
    current_password: str
    new_password: str


# ---------- Admin ----------

class AdminUserOut(BaseModel):
    id: PydanticObjectId
    full_name: str
    email: EmailStr
    role: str
    avatar_url: str | None = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminUserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    role: str | None = None
    is_active: bool | None = None


class AdminUserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "student"
