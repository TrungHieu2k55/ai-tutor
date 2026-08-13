import asyncio
import io

try:
    import cloudinary
    import cloudinary.uploader
    HAS_CLOUDINARY = True
except ImportError:
    HAS_CLOUDINARY = False

from fastapi import HTTPException
from src.config.environment import Settings


def init_cloudinary():
    if not HAS_CLOUDINARY:
        raise HTTPException(
            status_code=500,
            detail="Thư viện 'cloudinary' chưa được cài đặt trong môi trường Python (.venv). Vui lòng chạy lệnh: pip install cloudinary",
        )
    current_settings = Settings()
    if not (current_settings.CLOUDINARY_CLOUD_NAME and current_settings.CLOUDINARY_API_KEY and current_settings.CLOUDINARY_API_SECRET):
        raise HTTPException(
            status_code=400,
            detail="Cloudinary chưa được cấu hình. Vui lòng thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET vào file backend/.env",
        )
    cloudinary.config(
        cloud_name=current_settings.CLOUDINARY_CLOUD_NAME,
        api_key=current_settings.CLOUDINARY_API_KEY,
        api_secret=current_settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


async def upload_image_bytes(file_bytes: bytes, folder_name: str = "user_aitutor") -> str:
    """Uploads file bytes to Cloudinary and returns the secure URL."""
    current_settings = Settings()
    init_cloudinary()
    try:
        file_stream = io.BytesIO(file_bytes)
        
        if current_settings.CLOUDINARY_UPLOAD_PRESET:
            result = await asyncio.to_thread(
                cloudinary.uploader.unsigned_upload,
                file_stream,
                upload_preset=current_settings.CLOUDINARY_UPLOAD_PRESET,
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
        if not url:
            raise HTTPException(status_code=500, detail="Không nhận được secure_url từ Cloudinary")
        return url
    except HTTPException:
        raise
    except Exception as e:
        err_msg = str(e)
        if "missing permissions" in err_msg.lower() or "forbidden" in err_msg.lower():
            raise HTTPException(
                status_code=403,
                detail="Cloudinary báo lỗi thiếu quyền 'create'. Vui lòng kiểm tra lại Access Key permissions trên Cloudinary Console hoặc tạo một Upload Preset (Unsigned) rồi thêm CLOUDINARY_UPLOAD_PRESET vào file backend/.env.",
            )
        raise HTTPException(status_code=500, detail=f"Lỗi khi upload ảnh lên Cloudinary: {err_msg}")
