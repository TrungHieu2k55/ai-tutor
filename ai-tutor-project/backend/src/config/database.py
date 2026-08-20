from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from src.config.environment import settings
from src.config.security import hash_password
from src.models.conversation_model import Conversation
from src.models.document_model import Document
from src.models.message_model import Message
from src.models.system_setting_model import SystemSetting
from src.models.user_model import User

# Patch tương thích giữa Beanie và Motor/PyMongo phiên bản mới
if not hasattr(AsyncIOMotorClient, "append_metadata"):
    AsyncIOMotorClient.append_metadata = lambda *args, **kwargs: None

_client: AsyncIOMotorClient | None = None


async def init_db():
    """Kết nối MongoDB và khởi tạo Beanie cho toàn bộ Document models."""
    global _client
    _client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=_client[settings.MONGODB_DB_NAME],
        document_models=[User, Document, Conversation, Message, SystemSetting],
    )
    await _seed_default_admin()


async def _seed_default_admin():
    """Tự động tạo tài khoản admin mặc định nếu hệ thống chưa có admin nào."""
    try:
        admin = await User.find_one(User.role == "admin")
        if not admin:
            default_admin = User(
                full_name="Quản trị viên Hệ thống",
                email="admin@aitutor.vn",
                hashed_password=hash_password("admin123"),
                role="admin",
                is_active=True,
            )
            await default_admin.insert()
            print("--> Đã tạo tài khoản admin mặc định: admin@aitutor.vn / admin123")
    except Exception as e:
        print(f"--> Không thể kiểm tra/tạo admin mặc định: {e}")
