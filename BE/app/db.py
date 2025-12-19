from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base


metadata = MetaData(schema="restaurant")

DATABASE_URL = "postgresql+psycopg2://postgres:Nam30072003@localhost:5432/restaurant"

engine = create_engine(DATABASE_URL, echo=False)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base(metadata=metadata)
# #create all tables in schema if not exist  
# Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()