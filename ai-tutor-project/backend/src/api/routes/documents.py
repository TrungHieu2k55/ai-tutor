import os
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user
from src.core.config import settings
from src.db.database import get_db
from src.db.models import Document, User
from src.schemas.document import DocumentOut
from src.services.document_processor import process_document
from src.services.vector_store import index_chunks

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_TYPES = {"pdf", "docx", "xlsx"}


async def _process_and_index(document_id: str, file_path: str, file_type: str, db: AsyncSession):
    """Chạy nền: trích xuất -> chunk -> embedding -> lưu vector DB -> cập nhật trạng thái."""
    try:
        chunks = process_document(file_path, file_type)
        index_chunks(document_id, chunks)
        doc = await db.get(Document, document_id)
        doc.status = "indexed"
        doc.page_count = max((c.page or 0) for c in chunks) if chunks else 0
        await db.commit()
    except Exception:
        doc = await db.get(Document, document_id)
        doc.status = "failed"
        await db.commit()


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    file_ext = file.filename.split(".")[-1].lower()
    if file_ext not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ PDF, DOCX, XLSX")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    document_id = str(uuid.uuid4())
    file_path = os.path.join(settings.UPLOAD_DIR, f"{document_id}.{file_ext}")

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    document = Document(
        id=document_id,
        owner_id=user.id,
        file_name=file.filename,
        file_path=file_path,
        file_type=file_ext,
        size_bytes=len(content),
        status="processing",
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    background_tasks.add_task(_process_and_index, document_id, file_path, file_ext, db)

    return document


@router.get("/", response_model=list[DocumentOut])
async def list_my_documents(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.scalars(select(Document).where(Document.owner_id == user.id))
    return result.all()
