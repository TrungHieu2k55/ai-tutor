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


class AuthService:
    @staticmethod
    async def register(payload: UserCreate) -> User:
        email = payload.email.strip().lower()
        existing = await User.find_one(User.email == email)
        if existing:
            raise HTTPException(status_code=400, detail="Email đã được sử dụng")

        user = User(
            full_name=payload.full_name,
            email=email,
            hashed_password=hash_password(payload.password),
        )
        await user.insert()
        return user

    @staticmethod
    async def login(payload: UserLogin) -> TokenOut:
        email = payload.email.strip().lower()
        user = await User.find_one(User.email == email)
        if not user or not verify_password(payload.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

        token = create_access_token(subject=str(user.id))
        return TokenOut(access_token=token)


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

