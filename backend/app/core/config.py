import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "Quincaillerie Management Platform"
    API_V1_STR: str = "/api/v1"
    
    # Database
    POSTGRES_USER: str = "quincail_user"
    POSTGRES_PASSWORD: str = "quincail_password_2026"
    POSTGRES_DB: str = "quincail_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5433
    
    DATABASE_URL: str = "postgresql+asyncpg://quincail_user:quincail_password_2026@localhost:5433/quincail_db"
    DATABASE_SYNC_URL: str = "postgresql+psycopg://quincail_user:quincail_password_2026@localhost:5433/quincail_db"
    
    # Security
    SECRET_KEY: str = "supersecretkey_quincail_app_2026_jwt_token_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
        "http://localhost:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
