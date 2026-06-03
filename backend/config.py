import os

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres.wgnydobitcnertpxzsnb:23012005Phuoc%40@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
)
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "123456") # Standard default password
DB_NAME = os.environ.get("DB_NAME", "postgres") # Default pg database or circlek
