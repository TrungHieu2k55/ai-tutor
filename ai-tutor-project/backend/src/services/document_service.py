import logging
import os
import uuid
from beanie import PydanticObjectId
from fastapi import BackgroundTasks, HTTPException, UploadFile

from src.config.environment import settings
from src.models.conversation_model import Conversation
from src.models.document_model import Document
from src.models.message_model import Message
from src.models.user_model import User
from src.providers.vector_store_provider import delete_document_index, index_chunks
from src.services.document_processor import process_document

logger = logging.getLogger(__name__)
ALLOWED_TYPES = {"pdf", "docx", "xlsx", "txt"}


async def _process_and_index(document_id: str, file_path: str, file_type: str):
    """Chạy nền: trích xuất -> chunk -> embedding -> lưu vector DB -> cập nhật trạng thái."""
    doc = await Document.get(document_id)
    try:
        chunks = process_document(file_path, file_type)
        index_chunks(document_id, chunks)
        doc.status = "indexed"
        doc.page_count = max((c.page or 0) for c in chunks) if chunks else 0
        await doc.save()
    except Exception:
        logger.exception("Xử lý tài liệu %s thất bại", document_id)
        doc.status = "failed"
        await doc.save()


class DocumentService:
    @staticmethod
    async def upload_document(
        background_tasks: BackgroundTasks,
        file: UploadFile,
        user: User,
    ) -> Document:
        file_ext = file.filename.split(".")[-1].lower() if file.filename else ""
        if file_ext not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail="Chỉ hỗ trợ PDF, DOCX, XLSX, TXT")

        content = await file.read()
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if len(content) > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"Dung lượng file vượt quá giới hạn cho phép ({settings.MAX_UPLOAD_SIZE_MB}MB)",
            )

        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        file_uid = str(uuid.uuid4())
        file_path = os.path.join(settings.UPLOAD_DIR, f"{file_uid}.{file_ext}")

        with open(file_path, "wb") as f:
            f.write(content)

        document = Document(
            owner_id=str(user.id),
            file_name=file.filename or "unnamed",
            file_path=file_path,
            file_type=file_ext,
            size_bytes=len(content),
            status="processing",
        )
        await document.insert()

        background_tasks.add_task(_process_and_index, str(document.id), file_path, file_ext)

        return document

    @staticmethod
    async def list_my_documents(user: User) -> list[Document]:
        return await Document.find(Document.owner_id == str(user.id)).to_list()

    @staticmethod
    async def delete_document(document_id: str, user: User) -> dict:
        try:
            doc = await Document.get(PydanticObjectId(document_id))
        except Exception:
            doc = None

        if not doc or doc.owner_id != str(user.id):
            raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")

        # Xoá file vật lý
        if os.path.exists(doc.file_path):
            os.remove(doc.file_path)

        # Xoá vector index
        try:
            delete_document_index(str(doc.id))
        except Exception:
            logger.warning("Không thể xoá vector index cho document %s", document_id)

        # Xoá conversations + messages liên quan
        conversations = await Conversation.find(Conversation.document_id == str(doc.id)).to_list()
        for conv in conversations:
            await Message.find(Message.conversation_id == str(conv.id)).delete()
            await conv.delete()

        await doc.delete()
        return {"detail": "Đã xoá tài liệu thành công"}
