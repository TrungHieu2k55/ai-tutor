"""
Admin API routes — chỉ cho phép user có role "admin" truy cập.
Cung cấp thống kê hệ thống, quản lý users/documents, và giám sát AI pipeline.
"""

import os
from datetime import datetime, timedelta, timezone

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from src.api.deps import require_admin
from src.core.security import hash_password
from src.db.models import Conversation, Document, Message, User
from src.schemas.document import AdminDocumentOut
from src.schemas.user import AdminUserCreate, AdminUserOut, AdminUserUpdate

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_admin)])


# ---------- Dashboard Stats ----------


@router.get("/stats")
async def get_stats():
    """Thống kê tổng quan cho dashboard admin."""
    try:
        total_users = await User.count()
        total_documents = await Document.count()
        total_messages = await Message.count()

        # Tính tổng dung lượng (bytes → GB) bằng Python sum (an toàn 100%)
        docs = await Document.find_all().to_list()
        total_bytes = sum(getattr(d, "size_bytes", 0) or 0 for d in docs)
        storage_gb = round(total_bytes / (1024 ** 3), 4)

        # Đếm trạng thái documents
        indexed_count = sum(1 for d in docs if d.status == "indexed")
        processing_count = sum(1 for d in docs if d.status == "processing")
        failed_count = sum(1 for d in docs if d.status == "failed")

        # Users mới (7 ngày gần đây)
        week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        new_users_week = await User.find(User.created_at >= week_ago).count()

        return {
            "total_users": total_users,
            "total_documents": total_documents,
            "total_messages": total_messages,
            "storage_gb": storage_gb,
            "new_users_week": new_users_week,
            "indexed_count": indexed_count,
            "processing_count": processing_count,
            "failed_count": failed_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi tính thống kê: {str(e)}")


# ---------- User Management ----------


@router.get("/users", response_model=list[AdminUserOut])
async def list_users():
    """Danh sách tất cả users."""
    return await User.find_all().sort("-created_at").to_list()


@router.post("/users", response_model=AdminUserOut, status_code=201)
async def create_user(payload: AdminUserCreate):
    """Admin tạo user mới."""
    existing = await User.find_one(User.email == payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    await user.insert()
    return user


@router.put("/users/{user_id}", response_model=AdminUserOut)
async def update_user(user_id: str, payload: AdminUserUpdate):
    """Cập nhật thông tin user (role, is_active, ...)."""
    try:
        user = await User.get(PydanticObjectId(user_id))
    except Exception:
        user = None

    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Không có dữ liệu cập nhật")

    for field, value in update_data.items():
        setattr(user, field, value)
    await user.save()
    return user


@router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    """Xoá user."""
    try:
        user = await User.get(PydanticObjectId(user_id))
    except Exception:
        user = None

    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    await user.delete()
    return {"detail": "Đã xoá người dùng"}


# ---------- Document Management ----------


@router.get("/documents", response_model=list[AdminDocumentOut])
async def list_all_documents():
    """Danh sách tất cả documents (toàn hệ thống) kèm tên chủ sở hữu."""
    docs = await Document.find_all().sort("-created_at").to_list()

    owner_ids = list({d.owner_id for d in docs})
    users = {}
    for oid in owner_ids:
        try:
            u = await User.get(PydanticObjectId(oid))
            if u:
                users[oid] = u.full_name
        except Exception:
            pass

    result = []
    for doc in docs:
        doc_dict = doc.model_dump()
        doc_dict["owner_name"] = users.get(doc.owner_id, "Không rõ")
        result.append(AdminDocumentOut(**doc_dict))
    return result


@router.delete("/documents/{doc_id}")
async def admin_delete_document(doc_id: str):
    """Admin xoá document bất kỳ."""
    try:
        doc = await Document.get(PydanticObjectId(doc_id))
    except Exception:
        doc = None

    if not doc:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")

    # Xoá file vật lý
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    # Xoá vector index
    try:
        from src.services.vector_store import delete_document_index
        delete_document_index(str(doc.id))
    except Exception:
        pass

    # Xoá các conversations + messages liên quan
    conversations = await Conversation.find(Conversation.document_id == str(doc.id)).to_list()
    for conv in conversations:
        await Message.find(Message.conversation_id == str(conv.id)).delete()
        await conv.delete()

    await doc.delete()
    return {"detail": "Đã xoá tài liệu"}


# ---------- AI Monitor / Query Logs ----------


@router.get("/recent-queries")
async def get_recent_queries():
    """Lấy các câu hỏi gần đây (tối đa 20) kèm thông tin response time."""
    try:
        user_messages = await Message.find(
            Message.role == "user"
        ).sort("-created_at").limit(20).to_list()

        results = []
        for msg in user_messages:
            assistant_msg = await Message.find_one(
                Message.conversation_id == msg.conversation_id,
                Message.role == "assistant",
                Message.created_at >= msg.created_at,
            )

            doc_name = "—"
            user_name = "Ẩn danh"
            if msg.conversation_id:
                try:
                    conv = await Conversation.get(PydanticObjectId(msg.conversation_id))
                    if conv:
                        if conv.document_id:
                            doc = await Document.get(PydanticObjectId(conv.document_id))
                            if doc:
                                doc_name = doc.file_name
                        if conv.user_id:
                            u = await User.get(PydanticObjectId(conv.user_id))
                            if u:
                                user_name = u.full_name
                except Exception:
                    pass

            latency_ms = assistant_msg.response_time_ms if assistant_msg and assistant_msg.response_time_ms else None
            if latency_ms is not None:
                latency_str = f"{latency_ms / 1000:.1f}s"
                status = "success" if latency_ms < 3000 else "slow"
            elif assistant_msg:
                latency_str = "—"
                status = "success"
            else:
                latency_str = "—"
                status = "error"

            time_str = msg.created_at.strftime("%H:%M:%S") if msg.created_at else "—"

            results.append({
                "time": time_str,
                "user_name": user_name,
                "question": (msg.content or "")[:100],
                "document_name": doc_name,
                "latency": latency_str,
                "status": status,
            })

        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi lấy nhật ký câu hỏi: {str(e)}")


@router.get("/ai-stats")
async def get_ai_stats():
    """Thống kê AI pipeline: avg response time, success rate, tổng câu hỏi hôm nay."""
    try:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

        today_questions = await Message.find(
            Message.role == "user",
            Message.created_at >= today_start,
        ).count()

        # Tính avg response time từ assistant messages có response_time_ms
        assistant_msgs = await Message.find(
            Message.role == "assistant",
        ).to_list()

        valid_times = [m.response_time_ms for m in assistant_msgs if m.response_time_ms and m.response_time_ms > 0]
        avg_ms = (sum(valid_times) / len(valid_times)) if valid_times else 0
        total_answered = len(valid_times)

        total_user_msgs = await Message.find(Message.role == "user").count()
        total_assistant_msgs = len(assistant_msgs)

        success_rate = round((total_assistant_msgs / total_user_msgs * 100), 1) if total_user_msgs > 0 else 100

        return {
            "today_questions": today_questions,
            "avg_response_ms": round(avg_ms) if avg_ms else 0,
            "avg_response_str": f"{avg_ms / 1000:.1f}s" if avg_ms else "0s",
            "success_rate": success_rate,
            "total_answered": total_answered,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi tính AI stats: {str(e)}")
