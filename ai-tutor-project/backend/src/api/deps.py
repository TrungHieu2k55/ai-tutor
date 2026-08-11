from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import decode_access_token
from src.db.database import get_db
from src.db.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc đã hết hạn")

    user = await db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Người dùng không tồn tại hoặc đã bị khoá")
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Yêu cầu quyền quản trị viên")
    return user
