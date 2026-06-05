import os

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres.wgnydobitcnertpxzsnb:23012005Phuoc%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
)
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "123456") # Standard default password
DB_NAME = os.environ.get("DB_NAME", "postgres") # Default pg database or convenia

SECRET_KEY = os.environ.get("SECRET_KEY", "convenia-secret-key-super-secure-1234567890")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 5  # 5 minutes as planned
REFRESH_TOKEN_EXPIRE_DAYS = 7    # 7 days as planned
