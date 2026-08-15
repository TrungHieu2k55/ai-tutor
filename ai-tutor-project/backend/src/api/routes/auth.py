import logging
import random

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from src.api.deps import get_current_user
from src.core.security import create_access_token, hash_password, verify_password
from src.db.models import User
from src.schemas.user import (
    ChangePassword,
    ForgotPasswordRequest,
    ResendOtpRequest,
    ResetPasswordRequest,
    TokenOut,
    UpdateProfile,
    UserCreate,
    UserLogin,
    UserOut,
    VerifyOtpRequest,
)
from src.services.cloudinary_service import upload_image_bytes

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate):
    existing = await User.find_one(User.email == payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    otp = str(random.randint(100000, 999999))
    logger.info("Mã OTP xác thực đăng ký cho email %s: %s", payload.email, otp)

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_verified=False,
        otp_code=otp,
    )
    await user.insert()
    return user


@router.post("/verify-otp", response_model=TokenOut)
async def verify_otp(payload: VerifyOtpRequest):
    user = await User.find_one(User.email == payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="Email chưa được đăng ký")

    if user.is_verified:
        token = create_access_token(subject=str(user.id))
        return TokenOut(access_token=token)

    if not user.otp_code or user.otp_code != payload.otp_code.strip():
        raise HTTPException(status_code=400, detail="Mã OTP không chính xác")

    user.is_verified = True
    user.otp_code = None
    await user.save()

    token = create_access_token(subject=str(user.id))
    return TokenOut(access_token=token)


@router.post("/resend-otp")
async def resend_otp(payload: ResendOtpRequest):
    user = await User.find_one(User.email == payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="Email chưa được đăng ký")

    otp = str(random.randint(100000, 999999))
    user.otp_code = otp
    await user.save()
    logger.info("Mã OTP mới cho %s: %s", payload.email, otp)
    return {"detail": f"Đã gửi lại mã OTP xác thực (Mã thử nghiệm: {otp})"}


@router.post("/login", response_model=TokenOut)
async def login(payload: UserLogin):
    user = await User.find_one(User.email == payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    if not user.is_verified:
        raise HTTPException(
            status_code=400,
            detail="Tài khoản chưa được xác thực email. Vui lòng hoàn tất xác thực OTP.",
        )

    token = create_access_token(subject=str(user.id))
    return TokenOut(access_token=token)


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    user = await User.find_one(User.email == payload.email)
    if not user:
        # Bảo mật: Không tiết lộ email có tồn tại hay không
        return {"detail": "Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi."}

    reset_token = str(random.randint(100000, 999999))
    user.reset_token = reset_token
    user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    await user.save()

    logger.info("Mã Reset Password cho %s: %s", payload.email, reset_token)
    return {
        "detail": f"Mã đặt lại mật khẩu đã được tạo (Mã thử nghiệm: {reset_token}). Mã có hiệu lực trong 15 phút.",
        "reset_token": reset_token,
    }


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    user = await User.find_one(User.email == payload.email)
    if not user or not user.reset_token or user.reset_token != payload.reset_token.strip():
        raise HTTPException(status_code=400, detail="Mã đặt lại mật khẩu không hợp lệ")

    if user.reset_token_expires_at:
        exp = user.reset_token_expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > exp:
            raise HTTPException(status_code=400, detail="Mã đặt lại mật khẩu đã hết hạn")

    user.hashed_password = hash_password(payload.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    await user.save()

    return {"detail": "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại."}


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


