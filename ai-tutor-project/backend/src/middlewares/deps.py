from enum import Enum
from beanie import PydanticObjectId
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

from src.config.security import decode_access_token
from src.models.user_model import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class UserRole(str, Enum):
    STUDENT = "student"
    ADMIN = "admin"


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc đã hết hạn")

    try:
        user = await User.get(PydanticObjectId(user_id))
    except Exception:
        user = None

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Người dùng không tồn tại hoặc đã bị khoá")
    return user


def require_roles(allowed_roles: list[UserRole | str]):
    """Middleware kiểm tra phân quyền RBAC đa vai trò."""
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        roles = [r.value if isinstance(r, UserRole) else r for r in allowed_roles]
        if user.role not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Quyền truy cập bị từ chối. Yêu cầu quyền: {', '.join(roles)}"
            )
        return user
    return role_checker


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=403, detail="Yêu cầu quyền quản trị viên")
    return user

