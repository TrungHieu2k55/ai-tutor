from fastapi import APIRouter, Depends, File, UploadFile, status

from src.middlewares.deps import get_current_user
from src.models.user_model import User
from src.services.auth_service import AuthService
from src.validations.user_validation import (
    ChangePassword,
    TokenOut,
    UpdateProfile,
    UserCreate,
    UserLogin,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate):
    return await AuthService.register(payload)


@router.post("/login", response_model=TokenOut)
async def login(payload: UserLogin):
    return await AuthService.login(payload)


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

