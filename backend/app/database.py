import os
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgrespassword@localhost:5432/inventory_db?schema=public"
)

# Convert postgresql:// to postgresql+psycopg2:// if required
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Strip 'schema' parameter as it is unsupported by psycopg2
try:
    parsed = urlparse(DATABASE_URL)
    if parsed.query:
        query_params = parse_qs(parsed.query)
        query_params.pop("schema", None)
        new_query = urlencode(query_params, doseq=True)
        DATABASE_URL = urlunparse(parsed._replace(query=new_query))
except Exception:
    pass

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get db session in FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
