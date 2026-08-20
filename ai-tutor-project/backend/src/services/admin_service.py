import os
from datetime import datetime, timedelta, timezone

from beanie import PydanticObjectId
from fastapi import HTTPException

from src.config.security import hash_password
from src.models.conversation_model import Conversation
from src.models.document_model import Document
from src.models.message_model import Message
from src.models.system_setting_model import SystemSetting
from src.models.user_model import User
from src.providers.vector_store_provider import delete_document_index
from src.validations.document_validation import AdminDocumentOut
from src.validations.user_validation import AdminUserCreate, AdminUserOut, AdminUserUpdate


class AdminService:
    @staticmethod
    async def get_settings() -> SystemSetting:
        setting = await SystemSetting.find_one()
        if not setting:
            setting = SystemSetting()
            await setting.insert()
        return setting

    @staticmethod
    async def update_settings(payload: dict) -> SystemSetting:
        setting = await SystemSetting.find_one()
        if not setting:
            setting = SystemSetting()
            await setting.insert()

        for key, value in payload.items():
            if hasattr(setting, key) and value is not None:
                setattr(setting, key, value)

        await setting.save()
        return setting

    @staticmethod
    async def get_stats() -> dict:
        try:
            total_users = await User.count()
            total_documents = await Document.count()
            total_messages = await Message.count()

            docs = await Document.find_all().to_list()
            total_bytes = sum(getattr(d, "size_bytes", 0) or 0 for d in docs)
            storage_gb = round(total_bytes / (1024 ** 3), 4)

            indexed_count = sum(1 for d in docs if d.status == "indexed")
            processing_count = sum(1 for d in docs if d.status == "processing")
            failed_count = sum(1 for d in docs if d.status == "failed")

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

    @staticmethod
    async def list_users(page: int = 1, page_size: int = 10, search: str | None = None) -> dict:
        query = {}
        if search and search.strip():
            s = search.strip()
            query = {
                "$or": [
                    {"email": {"$regex": s, "$options": "i"}},
                    {"full_name": {"$regex": s, "$options": "i"}},
                ]
            }

        total = await User.find(query).count()
        skip = (max(1, page) - 1) * page_size
        users = await User.find(query).sort("-created_at").skip(skip).limit(page_size).to_list()

        return {
            "items": [AdminUserOut.model_validate(u) for u in users],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    @staticmethod
    async def create_user(payload: AdminUserCreate) -> User:
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

    @staticmethod
    async def update_user(user_id: str, payload: AdminUserUpdate) -> User:
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

    @staticmethod
    async def delete_user(user_id: str) -> dict:
        try:
            user = await User.get(PydanticObjectId(user_id))
        except Exception:
            user = None

        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

        await user.delete()
        return {"detail": "Đã xoá người dùng"}

    @staticmethod
    async def list_all_documents(page: int = 1, page_size: int = 10, search: str | None = None) -> dict:
        query = {}
        if search and search.strip():
            s = search.strip()
            query = {"file_name": {"$regex": s, "$options": "i"}}

        total = await Document.find(query).count()
        skip = (max(1, page) - 1) * page_size
        docs = await Document.find(query).sort("-created_at").skip(skip).limit(page_size).to_list()

        owner_ids = list({d.owner_id for d in docs if d.owner_id})
        users = {}
        for oid in owner_ids:
            try:
                u = await User.get(PydanticObjectId(oid))
                if u:
                    users[oid] = u.full_name
            except Exception:
                pass

        items = []
        for doc in docs:
            doc_dict = doc.model_dump()
            doc_dict["owner_name"] = users.get(doc.owner_id, "Không rõ")
            items.append(AdminDocumentOut(**doc_dict))

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    @staticmethod
    async def delete_document(doc_id: str) -> dict:
        try:
            doc = await Document.get(PydanticObjectId(doc_id))
        except Exception:
            doc = None

        if not doc:
            raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")

        if os.path.exists(doc.file_path):
            try:
                os.remove(doc.file_path)
            except Exception:
                pass

        try:
            delete_document_index(str(doc.id))
        except Exception:
            pass

        conversations = await Conversation.find(Conversation.document_id == str(doc.id)).to_list()
        for conv in conversations:
            await Message.find(Message.conversation_id == str(conv.id)).delete()
            await conv.delete()

        await doc.delete()
        return {"detail": "Đã xoá tài liệu"}

    @staticmethod
    async def get_recent_queries() -> list[dict]:
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

    @staticmethod
    async def get_ai_stats() -> dict:
        try:
            today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

            today_questions = await Message.find(
                Message.role == "user",
                Message.created_at >= today_start,
            ).count()

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
