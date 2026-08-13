from fastapi import APIRouter, Depends

from src.middlewares.deps import get_current_user
from src.models.user_model import User
from src.services.chat_service import ChatService
from src.validations.document_validation import (
    AskRequest,
    AskResponse,
    ConversationOut,
    CreateConversation,
    MessageOut,
)

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/conversations", response_model=ConversationOut)
async def create_conversation(
    payload: CreateConversation,
    user: User = Depends(get_current_user),
):
    return await ChatService.create_conversation(payload, user)


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(
    document_id: str | None = None,
    user: User = Depends(get_current_user),
):
    return await ChatService.list_conversations(document_id, user)


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
async def get_messages(
    conversation_id: str,
    user: User = Depends(get_current_user),
):
    return await ChatService.get_messages(conversation_id, user)


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
):
    return await ChatService.delete_conversation(conversation_id, user)


@router.post("/ask", response_model=AskResponse)
async def ask(
    payload: AskRequest,
    user: User = Depends(get_current_user),
):
    return await ChatService.ask(payload, user)
