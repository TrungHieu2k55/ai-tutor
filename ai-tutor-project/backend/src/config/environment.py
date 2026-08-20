from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Tutor API"
    ENV: str = "development"
    DEBUG: bool = True

    # Database (MongoDB)
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "ai_tutor"

    # Auth (JWT)
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # LLM / Embedding provider
    DEEPSEEK_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "deepseek/deepseek-chat"
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Vector database
    VECTOR_DB_PATH: str = "./storage/vector_db"

    # Upload
    UPLOAD_DIR: str = "./storage/uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    CLOUDINARY_UPLOAD_PRESET: str = ""

    # MailerSend
    MAILERSEND_API_KEY: str = ""
    MAIL_FROM_EMAIL: str = "MS_CSAWGD@test-y7zpl98zo7345vx6.mlsender.net"
    MAIL_FROM_NAME: str = "AI Tutor System"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
