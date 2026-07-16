# ROLE: Centralise toutes les variables d'environnement
#
# Utilise Pydantic Settings pour charger les variables depuis .env
# Contient: SUPABASE_URL, SUPABASE_KEY, LLM_API_KEY, JWT_SECRET, etc.
#
# Sera implémenté en Phase 4 avec la classe Settings(BaseSettings).

from pydantic_settings import BaseSettings , SettingsConfigDict
class Settings(BaseSettings):
    SUPABASE_URL:str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    LLM_API_KEY: str
    DATABASE_URL: str
    MAX_FILE_SIZE_MB: int = 5
    ALLOWED_MIME_TYPES: list[str] = ["application/pdf"]

  

    model_config=SettingsConfigDict(env_file=".env")

settings=Settings()