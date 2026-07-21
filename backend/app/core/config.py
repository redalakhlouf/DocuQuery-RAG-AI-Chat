from pydantic_settings import BaseSettings , SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    SUPABASE_URL:str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    LLM_API_KEY: str
    DATABASE_URL: str
    MAX_FILE_SIZE_MB: int = 5
    ALLOWED_MIME_TYPES: list[str] = ["application/pdf"]
    ALLOWED_ORIGINS: str = "http://localhost:3000,https://docuquery-mu.vercel.app"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    model_config=SettingsConfigDict(env_file=str(Path(__file__).parent.parent.parent / ".env"))

settings=Settings()