from sqlalchemy import create_engine, text

DATABASE_URL = "mysql+pymysql://root:Mcmp4-12c@127.0.0.1/health_wellness_store"

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("✅ Database connection successful!", result.fetchall())
except Exception as e:
    print("❌ Database connection failed:", str(e))
