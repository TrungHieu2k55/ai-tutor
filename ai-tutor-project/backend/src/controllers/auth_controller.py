from fastapi import APIRouter, Depends, File, UploadFile, status

from src.config.security import create_access_token, create_refresh_token, decode_refresh_token
from src.middlewares.deps import get_current_user
from src.models.user_model import User
from src.services.auth_service import AuthService
from src.validations.user_validation import (
    ChangePassword,
    ForgotPasswordRequest,
    RefreshTokenRequest,
    ResendOtpRequest,
    ResetPasswordRequest,
    TokenOut,
    UpdateProfile,
    UserCreate,
    UserLogin,
    UserOut,
    VerifyOtpRequest,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate):
    return await AuthService.register(payload)


@router.post("/verify-otp", response_model=TokenOut)
async def verify_otp(payload: VerifyOtpRequest):
    return await AuthService.verify_otp(payload.email, payload.otp_code)


@router.post("/resend-otp")
async def resend_otp(payload: ResendOtpRequest):
    return await AuthService.resend_otp(payload.email)


@router.post("/login", response_model=TokenOut)
async def login(payload: UserLogin):
    return await AuthService.login(payload)


@router.post("/refresh", response_model=TokenOut)
async def refresh_token(payload: RefreshTokenRequest):
    """Dùng refresh_token để lấy access_token mới mà không cần đăng nhập lại."""
    from beanie import PydanticObjectId
    from fastapi import HTTPException

    user_id = decode_refresh_token(payload.refresh_token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Refresh token không hợp lệ hoặc đã hết hạn")

    try:
        user = await User.get(PydanticObjectId(user_id))
    except Exception:
        user = None

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Người dùng không tồn tại hoặc đã bị khoá")

    new_access = create_access_token(subject=str(user.id))
    new_refresh = create_refresh_token(subject=str(user.id))
    return TokenOut(access_token=new_access, refresh_token=new_refresh)


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    return await AuthService.forgot_password(payload.email)


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    return await AuthService.reset_password(payload.email, payload.reset_token, payload.new_password)


@router.get("/me", response_model=UserOut)
async def get_me(user: User = Depends(get_current_user)):
    return user


@router.put("/profile", response_model=UserOut)
async def update_profile(
    payload: UpdateProfile,
    user: User = Depends(get_current_user),
):
    return await AuthService.update_profile(user, payload)


@router.post("/avatar", response_model=UserOut)
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    return await AuthService.upload_avatar(user, file)


@router.delete("/avatar", response_model=UserOut)
async def delete_avatar(
    user: User = Depends(get_current_user),
):
    return await AuthService.delete_avatar(user)


@router.put("/password")
async def change_password(
    payload: ChangePassword,
    user: User = Depends(get_current_user),
):
    return await AuthService.change_password(user, payload)

