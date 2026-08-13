from src.controllers.admin_controller import router as admin_router
from src.controllers.auth_controller import router as auth_router
from src.controllers.chat_controller import router as chat_router
from src.controllers.document_controller import router as document_router

__all__ = ["auth_router", "document_router", "chat_router", "admin_router"]
