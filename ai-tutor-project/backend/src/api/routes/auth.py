from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from src.api.deps import get_current_user
from src.core.security import create_access_token, hash_password, verify_password
from src.db.models import User
from src.schemas.user import (
    ChangePassword,
    TokenOut,
    UpdateProfile,
    UserCreate,
    UserLogin,
    UserOut,
)
from src.services.cloudinary_service import upload_image_bytes

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate):
    existing = await User.find_one(User.email == payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    await user.insert()
    return user


@router.post("/login", response_model=TokenOut)
async def login(payload: UserLogin):
    user = await User.find_one(User.email == payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    token = create_access_token(subject=str(user.id))
    return TokenOut(access_token=token)


@router.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    return user


# ---------- Profile ----------


@router.put("/profile", response_model=UserOut)
async def update_profile(
    payload: UpdateProfile,
    user: User = Depends(get_current_user),
):
    """Cập nhật tên hiển thị của người dùng."""
    user.full_name = payload.full_name
    await user.save()
    return user


@router.post("/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """Upload ảnh đại diện người dùng lên Cloudinary."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP,...)")

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="File rỗng, vui lòng chọn file khác")

    avatar_url = await upload_image_bytes(contents, folder_name="users")
    user.avatar_url = avatar_url
    await user.save()
    return user


@router.delete("/avatar", response_model=UserOut)
async def delete_avatar(
    user: User = Depends(get_current_user),
):
    """Xoá ảnh đại diện hiện tại của người dùng."""
    user.avatar_url = None
    await user.save()
    return user


@router.put("/password")
async def change_password(
    payload: ChangePassword,
    user: User = Depends(get_current_user),
):
    """Đổi mật khẩu: kiểm tra mật khẩu cũ, sau đó hash mật khẩu mới."""
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")

    user.hashed_password = hash_password(payload.new_password)
    await user.save()
    return {"detail": "Đổi mật khẩu thành công"}


@router.post("/promote-self")
async def promote_self_to_admin(
    user: User = Depends(get_current_user),
):
    """Nâng cấp tài khoản hiện tại thành Admin (phục vụ test)."""
    user.role = "admin"
    await user.save()
    return {"detail": "Đã nâng cấp quyền Admin cho tài khoản của bạn", "role": user.role}


