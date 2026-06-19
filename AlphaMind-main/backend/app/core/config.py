from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    PROJECT_NAME: str = "AlphaMind AI"
    API_V1_STR: str = "/api/v1"
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/alphamind"
    # JWT
    SECRET_KEY: str = "alphamind-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    # CORS
    CORS_ORIGINS: list[str] = ["*"]
    # Billing
    RATE_PER_SEARCH: float = 20.0  # INR per search
    # Invoice storage
    INVOICE_DIR: str = "./invoices"
    # Auth
    GOOGLE_CLIENT_ID: str = ""
    class Config:
        env_file = ".env"
settings = Settings()