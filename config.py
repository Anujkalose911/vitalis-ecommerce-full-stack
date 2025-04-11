from sqlalchemy import text  

SQLALCHEMY_DATABASE_URI = "mysql+pymysql://root:Mcmp4-12c@127.0.0.1/health_wellness_store"

SQLALCHEMY_ENGINE_OPTIONS = {
    "pool_pre_ping": True,
    "pool_recycle": 1800,
    "connect_args": {"init_command": "SELECT 1"}  
}

SQLALCHEMY_TRACK_MODIFICATIONS = False
