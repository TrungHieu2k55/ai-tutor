from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Tutor API"
    ENV: str = "development"
    DEBUG: bool = True

    # Database (PostgreSQL)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_tutor"

    # Auth (JWT)
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # LLM / Embedding provider
    ANTHROPIC_API_KEY: str = ""
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Vector database (Chroma local persistence path, hoặc URL nếu dùng dịch vụ ngoài)
    VECTOR_DB_PATH: str = "./storage/vector_db"

    # Upload
    UPLOAD_DIR: str = "./storage/uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
