from beanie import Document


class SystemSetting(Document):
    app_name: str = "AI Tutor"
    llm_provider: str = "openrouter"  # openrouter, deepseek, gemini, anthropic, offline
    openrouter_model: str = "deepseek/deepseek-chat"
    embedding_model: str = "text-embedding-3-small"
    chunk_size: int = 800
    chunk_overlap: int = 120
    max_upload_mb: int = 50
    allow_registration: bool = True

    class Settings:
        name = "system_settings"
