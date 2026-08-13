import json
from beanie import PydanticObjectId
from fastapi import HTTPException

from src.models.conversation_model import Conversation
from src.models.document_model import Document
from src.models.message_model import Message
from src.models.user_model import User
from src.services.rag_pipeline import answer_question
from src.validations.document_validation import (
    AskRequest,
    AskResponse,
    CreateConversation,
)


class ChatService:
    @staticmethod
    async def create_conversation(payload: CreateConversation, user: User) -> Conversation:
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

    @staticmethod
    async def list_conversations(document_id: str | None, user: User) -> list[Conversation]:
        query = {"user_id": str(user.id)}
        if document_id:
            query["document_id"] = document_id
        return await Conversation.find(query).sort("-created_at").to_list()

    @staticmethod
    async def get_messages(conversation_id: str, user: User) -> list[Message]:
        conversation = await Conversation.get(conversation_id)
        if not conversation or conversation.user_id != str(user.id):
            raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện")
        return await Message.find(
            Message.conversation_id == conversation_id
        ).sort("+created_at").to_list()

    @staticmethod
    async def delete_conversation(conversation_id: str, user: User) -> dict:
        try:
            conv = await Conversation.get(PydanticObjectId(conversation_id))
        except Exception:
            conv = None

        if not conv or conv.user_id != str(user.id):
            raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện")

        await Message.find(Message.conversation_id == conversation_id).delete()
        await conv.delete()
        return {"detail": "Đã xoá cuộc trò chuyện thành công"}

    @staticmethod
    async def ask(payload: AskRequest, user: User) -> AskResponse:
        document = await Document.get(payload.document_id)
        if not document or document.owner_id != str(user.id):
            raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        if document.status != "indexed":
            raise HTTPException(status_code=409, detail="Tài liệu đang được xử lý, vui lòng thử lại sau")

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

        user_msg = Message(
            conversation_id=conversation_id,
            role="user",
            content=payload.question,
        )
        await user_msg.insert()

        result = answer_question(str(document.id), payload.question)

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
