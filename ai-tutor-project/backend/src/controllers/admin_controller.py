from fastapi import APIRouter, Depends

from src.middlewares.deps import require_admin
from src.services.admin_service import AdminService
from src.validations.document_validation import AdminDocumentOut
from src.validations.user_validation import AdminUserCreate, AdminUserOut, AdminUserUpdate

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


@router.get("/stats")
async def get_stats():
    return await AdminService.get_stats()


@router.get("/users")
async def list_users(
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
):
    return await AdminService.list_users(page, page_size, search)


@router.post("/users", response_model=AdminUserOut, status_code=201)
async def create_user(payload: AdminUserCreate):
    return await AdminService.create_user(payload)


@router.put("/users/{user_id}", response_model=AdminUserOut)
async def update_user(user_id: str, payload: AdminUserUpdate):
    return await AdminService.update_user(user_id, payload)


@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    return await AdminService.delete_user(user_id)


@router.get("/documents")
async def list_all_documents(
    page: int = 1,
    page_size: int = 10,
    search: str | None = None,
):
    return await AdminService.list_all_documents(page, page_size, search)


@router.delete("/documents/{doc_id}")
async def admin_delete_document(doc_id: str):
    return await AdminService.delete_document(doc_id)


@router.get("/recent-queries")
async def get_recent_queries():
    return await AdminService.get_recent_queries()


@router.get("/ai-stats")
async def get_ai_stats():
    return await AdminService.get_ai_stats()
