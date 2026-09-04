from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile
from fastapi.responses import StreamingResponse
import re
import unicodedata
import urllib.parse

from src.middlewares.deps import get_current_user
from src.models.user_model import User
from src.services.document_service import DocumentService
from src.validations.document_validation import DocumentOut, ExportQuizRequest
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


@router.get("/progress")
async def get_learning_progress(user: User = Depends(get_current_user)):
    """Lấy dữ liệu tiến độ học tập theo độ bao phủ nội dung (Content Coverage)."""
    return await DocumentService.get_learning_progress(user)


@router.get("/{document_id}/quiz-questions")
async def get_quiz_questions(
    document_id: str,
    num_questions: int = 15,
    user: User = Depends(get_current_user),
):
    return await DocumentService.get_quiz_questions(
        document_id=document_id,
        user=user,
        num_questions=num_questions,
    )


@router.post("/{document_id}/quiz/export")
async def export_quiz_docx(
    document_id: str,
    payload: ExportQuizRequest,
    user: User = Depends(get_current_user),
):
    buffer, filename = await DocumentService.export_quiz_docx(
        document_id=document_id,
        user=user,
        questions=payload.questions,
        file_name=payload.file_name,
    )
    ascii_filename = unicodedata.normalize("NFKD", filename).encode("ascii", "ignore").decode("ascii")
    ascii_filename = re.sub(r"[^a-zA-Z0-9._-]", "_", ascii_filename)
    if not ascii_filename.endswith(".docx"):
        ascii_filename = f"{ascii_filename}.docx"
    if not ascii_filename or ascii_filename == ".docx":
        ascii_filename = "Trac_nghiem.docx"

    quoted_filename = urllib.parse.quote(filename)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename=\"{ascii_filename}\"; filename*=UTF-8''{quoted_filename}",
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.get("/{document_id}/quiz")
async def download_quiz(
    document_id: str,
    num_questions: int = 15,
    user: User = Depends(get_current_user),
):
    buffer, filename = await DocumentService.generate_quiz_file(
        document_id=document_id,
        user=user,
        num_questions=num_questions,
    )
    # RFC 6266 / RFC 5987: 'filename' phải là thuần ASCII cho HTTP header latin-1,
    # tên file tiếng Việt UTF-8 được mã hóa trong filename*
    ascii_filename = unicodedata.normalize("NFKD", filename).encode("ascii", "ignore").decode("ascii")
    ascii_filename = re.sub(r"[^a-zA-Z0-9._-]", "_", ascii_filename)
    if not ascii_filename.endswith(".docx"):
        ascii_filename = f"{ascii_filename}.docx"
    if not ascii_filename or ascii_filename == ".docx":
        ascii_filename = "Trac_nghiem.docx"

    quoted_filename = urllib.parse.quote(filename)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename=\"{ascii_filename}\"; filename*=UTF-8''{quoted_filename}",
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    user: User = Depends(get_current_user),
):
    return await DocumentService.delete_document(document_id, user)
