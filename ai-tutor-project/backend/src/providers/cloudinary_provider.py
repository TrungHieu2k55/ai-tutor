import asyncio
import io
import os
import uuid

try:
    import cloudinary
    import cloudinary.uploader
    HAS_CLOUDINARY = True
except ImportError:
    HAS_CLOUDINARY = False

from fastapi import HTTPException
from src.config.environment import settings


def init_cloudinary():
    if not HAS_CLOUDINARY:
        raise HTTPException(
            status_code=500,
            detail="Thư viện 'cloudinary' chưa được cài đặt trong môi trường Python.",
        )
    if not (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET):
        raise HTTPException(
            status_code=400,
            detail="Cloudinary chưa được cấu hình.",
        )
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


async def save_avatar_local(file_bytes: bytes, file_ext: str = "png") -> str:
    """Lưu avatar vào thư mục local storage khi không dùng Cloudinary."""
    avatar_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
    os.makedirs(avatar_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.{file_ext}"
    file_path = os.path.join(avatar_dir, filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)
    return f"/static/avatars/{filename}"


async def upload_image_bytes(file_bytes: bytes, folder_name: str = "user_aitutor", file_ext: str = "png") -> str:
    """Uploads file bytes to Cloudinary or falls back to local storage."""
    has_keys = bool(settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET)
    if HAS_CLOUDINARY and has_keys:
        try:
            init_cloudinary()
            file_stream = io.BytesIO(file_bytes)
            if settings.CLOUDINARY_UPLOAD_PRESET:
                result = await asyncio.to_thread(
                    cloudinary.uploader.unsigned_upload,
                    file_stream,
                    upload_preset=settings.CLOUDINARY_UPLOAD_PRESET,
                    folder=folder_name,
                )
            else:
                result = await asyncio.to_thread(
                    cloudinary.uploader.upload,
                    file_stream,
                    folder=folder_name,
                    resource_type="image",
                )
            url = result.get("secure_url")
            if url:
                return url
        except Exception:
            pass  # Tự động fallback xuống local bên dưới nếu Cloudinary lỗi

    return await save_avatar_local(file_bytes, file_ext)

