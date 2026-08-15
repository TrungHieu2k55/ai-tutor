import json

from fastapi import APIRouter, Depends, HTTPException

from src.api.deps import get_current_user
from src.db.models import Conversation, Document, Message, User
from src.schemas.document import (
    AskRequest,
    AskResponse,
    ConversationOut,
    CreateConversation,
    MessageOut,
    RenameConversation,
)
from src.services.rag_pipeline import answer_question

router = APIRouter(prefix="/chat", tags=["Chat"])


# ---------- Conversation management ----------


@router.post("/conversations", response_model=ConversationOut)
async def create_conversation(
    payload: CreateConversation,
    user: User = Depends(get_current_user),
):
    document = await Document.get(payload.document_id)
    if not document or document.owner_id != str(user.id):
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")

    conversation = Conversation(
        user_id=str(user.id),
        document_id=str(document.id),
        title=payload.title,
    )
    await conversation.insert()
    return conversation


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(
    document_id: str | None = None,
    user: User = Depends(get_current_user),
):
    query = {"user_id": str(user.id)}
    if document_id:
        query["document_id"] = document_id
    return await Conversation.find(query).sort("-created_at").to_list()


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
async def get_messages(
    conversation_id: str,
    user: User = Depends(get_current_user),
):
    conversation = await Conversation.get(conversation_id)
    if not conversation or conversation.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện")
    return await Message.find(
        Message.conversation_id == conversation_id
    ).sort("+created_at").to_list()


@router.put("/conversations/{conversation_id}", response_model=ConversationOut)
async def rename_conversation(
    conversation_id: str,
    payload: RenameConversation,
    user: User = Depends(get_current_user),
):
    from beanie import PydanticObjectId

    try:
        conv = await Conversation.get(PydanticObjectId(conversation_id))
    except Exception:
        conv = None

    if not conv or conv.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện")

    conv.title = payload.title.strip()
    await conv.save()
    return conv


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
):
    from beanie import PydanticObjectId

    try:
        conv = await Conversation.get(PydanticObjectId(conversation_id))
    except Exception:
        conv = None

    if not conv or conv.user_id != str(user.id):
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện")

    await Message.find(Message.conversation_id == conversation_id).delete()
    await conv.delete()
    return {"detail": "Đã xoá cuộc trò chuyện thành công"}


# ---------- Ask (RAG) ----------


@router.post("/ask", response_model=AskResponse)
async def ask(
    payload: AskRequest,
    user: User = Depends(get_current_user),
):
    document = await Document.get(payload.document_id)
    if not document or document.owner_id != str(user.id):
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
    if document.status != "indexed":
        raise HTTPException(status_code=409, detail="Tài liệu đang được xử lý, vui lòng thử lại sau")

    # Tạo hoặc dùng conversation hiện có
    conversation_id = None
    if payload.conversation_id:
        conversation_id = str(payload.conversation_id)
    else:
        conv = Conversation(
            user_id=str(user.id),
            document_id=str(document.id),
            title=payload.question[:60],
        )
        await conv.insert()
        conversation_id = str(conv.id)

    # Lưu message của user
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=payload.question,
    )
    await user_msg.insert()

    # Gọi RAG pipeline
    result = answer_question(str(document.id), payload.question)

    # Lưu message của assistant
    assistant_msg = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=result["answer"],
        sources=json.dumps(result["sources"], ensure_ascii=False) if result["sources"] else None,
        response_time_ms=result["response_time_ms"],
    )
    await assistant_msg.insert()

    return AskResponse(
        answer=result["answer"],
        sources=result["sources"],
        response_time_ms=result["response_time_ms"],
        conversation_id=conversation_id,
    )
