from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile

from src.middlewares.deps import get_current_user
from src.models.user_model import User
from src.services.document_service import DocumentService
from src.validations.document_validation import DocumentOut

from src.middlewares.rate_limiter import check_rate_limit

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentOut, dependencies=[Depends(check_rate_limit)])
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile,
    user: User = Depends(get_current_user),
):
    return await DocumentService.upload_document(background_tasks, file, user)


@router.get("", response_model=list[DocumentOut])
@router.get("/", response_model=list[DocumentOut])
async def list_my_documents(user: User = Depends(get_current_user)):
    return await DocumentService.list_my_documents(user)



@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    user: User = Depends(get_current_user),
):
    return await DocumentService.delete_document(document_id, user)
