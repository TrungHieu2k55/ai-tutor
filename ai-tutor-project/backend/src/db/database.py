from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from src.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG, future=True)

AsyncSessionLocal = async_sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """Tạo bảng nếu chưa tồn tại. Dùng Alembic cho migration ở môi trường production."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
