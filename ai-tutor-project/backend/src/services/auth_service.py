from fastapi import HTTPException, UploadFile, status

from src.config.security import create_access_token, hash_password, verify_password
from src.models.user_model import User
from src.providers.cloudinary_provider import upload_image_bytes
from src.validations.user_validation import (
    ChangePassword,
    TokenOut,
    UpdateProfile,
    UserCreate,
    UserLogin,
)


import asyncio
import logging
import random
from datetime import datetime, timedelta, timezone

from src.providers.email_provider import send_otp_email, send_reset_password_email

logger = logging.getLogger(__name__)


class AuthService:
    @staticmethod
    async def register(payload: UserCreate) -> User:
        email = payload.email.strip().lower()
        existing = await User.find_one(User.email == email)
        if existing:
            raise HTTPException(status_code=400, detail="Email đã được sử dụng")

        otp = str(random.randint(100000, 999999))
        logger.info("Mã OTP xác thực đăng ký cho %s: %s", email, otp)

        user = User(
            full_name=payload.full_name,
            email=email,
            hashed_password=hash_password(payload.password),
            is_verified=False,
            otp_code=otp,
        )
        await user.insert()
        asyncio.create_task(send_otp_email(email, otp, payload.full_name))
        return user

    @staticmethod
    async def verify_otp(email: str, otp_code: str) -> TokenOut:
        clean_email = email.strip()
        user = await User.find_one({"email": {"$regex": f"^{clean_email}$", "$options": "i"}})
        if not user:
            raise HTTPException(status_code=404, detail="Email này chưa được đăng ký")

        if user.is_verified:
            token = create_access_token(subject=str(user.id))
            return TokenOut(access_token=token)

        if not user.otp_code or user.otp_code != otp_code.strip():
            raise HTTPException(status_code=400, detail="Mã OTP không chính xác")

        user.is_verified = True
        user.otp_code = None
        await user.save()

        token = create_access_token(subject=str(user.id))
        return TokenOut(access_token=token)

    @staticmethod
    async def resend_otp(email: str) -> dict:
        clean_email = email.strip()
        user = await User.find_one({"email": {"$regex": f"^{clean_email}$", "$options": "i"}})
        if not user:
            raise HTTPException(status_code=404, detail="Email này chưa được đăng ký")

        otp = str(random.randint(100000, 999999))
        user.otp_code = otp
        await user.save()
        logger.info("Mã OTP gửi lại cho %s: %s", clean_email, otp)
        asyncio.create_task(send_otp_email(user.email, otp, user.full_name))
        return {"detail": "Đã gửi lại mã OTP tới email của bạn. Vui lòng kiểm tra hộp thư."}

    @staticmethod
    async def login(payload: UserLogin) -> TokenOut:
        clean_email = payload.email.strip()
        user = await User.find_one({"email": {"$regex": f"^{clean_email}$", "$options": "i"}})
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

        if not user.is_verified:
            raise HTTPException(
                status_code=400,
                detail="Tài khoản chưa được xác thực email. Vui lòng hoàn tất xác thực OTP.",
            )

        token = create_access_token(subject=str(user.id))
        return TokenOut(access_token=token)

    @staticmethod
    async def forgot_password(email: str) -> dict:
        clean_email = email.strip()
        user = await User.find_one({"email": {"$regex": f"^{clean_email}$", "$options": "i"}})
        if not user:
            raise HTTPException(status_code=404, detail="Email này chưa được đăng ký trong hệ thống")

        reset_token = str(random.randint(100000, 999999))
        user.reset_token = reset_token
        user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        await user.save()

        logger.info("Mã Reset Password cho %s: %s", clean_email, reset_token)
        asyncio.create_task(send_reset_password_email(user.email, reset_token, user.full_name))
        return {
            "detail": "Mã đặt lại mật khẩu đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư."
        }

    @staticmethod
    async def reset_password(email: str, reset_token: str, new_password: str) -> dict:
        clean_email = email.strip()
        user = await User.find_one({"email": {"$regex": f"^{clean_email}$", "$options": "i"}})
        if not user or not user.reset_token or user.reset_token != reset_token.strip():
            raise HTTPException(status_code=400, detail="Mã đặt lại mật khẩu không hợp lệ")

        if user.reset_token_expires_at:
            exp = user.reset_token_expires_at
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > exp:
                raise HTTPException(status_code=400, detail="Mã đặt lại mật khẩu đã hết hạn")

        user.hashed_password = hash_password(new_password)
        user.reset_token = None
        user.reset_token_expires_at = None
        await user.save()

        return {"detail": "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại."}


    @staticmethod
    async def update_profile(user: User, payload: UpdateProfile) -> User:
        user.full_name = payload.full_name
        await user.save()
        return user

    @staticmethod
    async def upload_avatar(user: User, file: UploadFile) -> User:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WEBP,...)")

        contents = await file.read()
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="File rỗng, vui lòng chọn file khác")

        avatar_url = await upload_image_bytes(contents, folder_name="user_aitutor")
        user.avatar_url = avatar_url
        await user.save()
        return user

    @staticmethod
    async def delete_avatar(user: User) -> User:
        user.avatar_url = None
        await user.save()
        return user

    @staticmethod
    async def change_password(user: User, payload: ChangePassword) -> dict:
        if not verify_password(payload.current_password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không đúng")

        user.hashed_password = hash_password(payload.new_password)
        await user.save()
        return {"detail": "Đổi mật khẩu thành công"}

