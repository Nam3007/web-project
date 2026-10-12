from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

import os
from dotenv import load_dotenv
load_dotenv()

metadata = MetaData(schema="restaurant")

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, echo=False)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base(metadata=metadata)
# #create all tables in schema if not exist  


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()