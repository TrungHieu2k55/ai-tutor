import io
import json
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
from src.services.rag_pipeline import build_quiz_docx, generate_quiz_questions

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

    @staticmethod
    async def get_quiz_questions(
        document_id: str,
        user: User,
        num_questions: int = 10,
    ) -> dict:
        try:
            doc = await Document.get(PydanticObjectId(document_id))
        except Exception:
            doc = None

        if not doc or doc.owner_id != str(user.id):
            raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")

        if doc.status != "indexed":
            raise HTTPException(
                status_code=400,
                detail="Tài liệu chưa được xử lý xong, không thể tạo câu hỏi ôn tập",
            )

        questions = await generate_quiz_questions(str(doc.id), num_questions=num_questions)
        return {
            "document_id": str(doc.id),
            "file_name": doc.file_name,
            "questions": questions,
        }

    @staticmethod
    async def export_quiz_docx(
        document_id: str,
        user: User,
        questions: list[dict],
        file_name: str | None = None,
    ) -> tuple[io.BytesIO, str]:
        try:
            doc = await Document.get(PydanticObjectId(document_id))
        except Exception:
            doc = None

        if not doc or doc.owner_id != str(user.id):
            raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")

        doc_name = file_name or doc.file_name
        buffer = build_quiz_docx(doc_name, questions)

        base_name = os.path.splitext(doc_name)[0].replace(" ", "_")
        filename = f"Trac_nghiem_{base_name}.docx"
        return buffer, filename

    @staticmethod
    async def generate_quiz_file(
        document_id: str,
        user: User,
        num_questions: int = 10,
    ) -> tuple[io.BytesIO, str]:
        try:
            doc = await Document.get(PydanticObjectId(document_id))
        except Exception:
            doc = None

        if not doc or doc.owner_id != str(user.id):
            raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")

        if doc.status != "indexed":
            raise HTTPException(
                status_code=400,
                detail="Tài liệu chưa được xử lý xong, không thể tạo câu hỏi ôn tập",
            )

        questions = await generate_quiz_questions(str(doc.id), num_questions=num_questions)
        buffer = build_quiz_docx(doc.file_name, questions)

        base_name = os.path.splitext(doc.file_name)[0].replace(" ", "_")
        filename = f"Trac_nghiem_{base_name}.docx"
        return buffer, filename

    @staticmethod
    async def get_learning_progress(user: User) -> dict:
        """
        Tính toán tiến độ học tập theo độ bao phủ nội dung (Content / Page Coverage):
        - Quét các cuộc hội thoại và tin nhắn của người dùng trên từng tài liệu.
        - Trích xuất tập hợp các trang đã từng xuất hiện trong nguồn trích dẫn (sources).
        - Tính % độ bao phủ: (số trang đã học / tổng số trang của file) * 100.
        """
        documents = await Document.find(Document.owner_id == str(user.id)).to_list()
        if not documents:
            return {
                "total_documents": 0,
                "indexed_documents": 0,
                "total_pages_mastered": 0,
                "total_questions_asked": 0,
                "average_coverage": 0,
                "items": [],
            }

        doc_items = []
        total_questions_all = 0
        all_mastered_pages_count = 0
        total_coverage_sum = 0
        indexed_docs_count = 0

        for doc in documents:
            convs = await Conversation.find(Conversation.document_id == str(doc.id)).to_list()
            conv_ids = [str(c.id) for c in convs]

            user_question_count = 0
            studied_pages = set()
            last_studied_at = None

            if conv_ids:
                messages = await Message.find({"conversation_id": {"$in": conv_ids}}).to_list()
                for m in messages:
                    if m.role == "user":
                        user_question_count += 1
                        if last_studied_at is None or m.created_at > last_studied_at:
                            last_studied_at = m.created_at
                    elif m.role == "assistant" and m.sources:
                        try:
                            sources_list = json.loads(m.sources)
                            if isinstance(sources_list, list):
                                for s in sources_list:
                                    p = s.get("page")
                                    if p is not None and isinstance(p, (int, float)) and int(p) > 0:
                                        studied_pages.add(int(p))
                        except Exception:
                            pass

            total_pages = max(1, doc.page_count or 1)
            if doc.status != "indexed":
                coverage_percent = 0
            elif user_question_count == 0:
                coverage_percent = 0
            elif len(studied_pages) > 0:
                coverage_percent = min(100, round((len(studied_pages) / total_pages) * 100))
            else:
                coverage_percent = 100 if total_pages == 1 else min(100, user_question_count * 15)

            if doc.status == "indexed":
                indexed_docs_count += 1
                total_coverage_sum += coverage_percent

            total_questions_all += user_question_count
            all_mastered_pages_count += len(studied_pages)

            doc_items.append({
                "document_id": str(doc.id),
                "file_name": doc.file_name,
                "file_type": doc.file_type,
                "status": doc.status,
                "total_pages": total_pages,
                "studied_pages_count": len(studied_pages),
                "studied_pages": sorted(list(studied_pages)),
                "coverage_percent": coverage_percent,
                "question_count": user_question_count,
                "last_studied_at": last_studied_at.isoformat() if last_studied_at else None,
                "created_at": doc.created_at.isoformat() if doc.created_at else None,
            })

        avg_coverage = round(total_coverage_sum / max(1, indexed_docs_count)) if indexed_docs_count > 0 else 0

        return {
            "total_documents": len(documents),
            "indexed_documents": indexed_docs_count,
            "total_pages_mastered": all_mastered_pages_count,
            "total_questions_asked": total_questions_all,
            "average_coverage": avg_coverage,
            "items": doc_items,
        }


