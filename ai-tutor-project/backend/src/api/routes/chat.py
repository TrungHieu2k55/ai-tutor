from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_current_user
from src.db.database import get_db
from src.db.models import Document, Message, User
from src.schemas.document import AskRequest, AskResponse
from src.services.rag_pipeline import answer_question

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/ask", response_model=AskResponse)
async def ask(
    payload: AskRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    document = await db.get(Document, payload.document_id)
    if not document or document.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
    if document.status != "indexed":
        raise HTTPException(status_code=409, detail="Tài liệu đang được xử lý, vui lòng thử lại sau")

    result = answer_question(str(document.id), payload.question)

    # Lưu lại lịch sử hội thoại (tuỳ chọn — có thể mở rộng để tạo Conversation nếu chưa có)
    if payload.conversation_id:
        message = Message(
            conversation_id=payload.conversation_id,
            role="assistant",
            content=result["answer"],
            response_time_ms=result["response_time_ms"],
        )
        db.add(message)
        await db.commit()

    return AskResponse(**result)
