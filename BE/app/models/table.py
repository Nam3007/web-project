from db import Base
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
import enum
from sqlalchemy.orm import relationship



class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True)
    table_number = Column(String(10), unique=True, nullable=False)
    table_size = Column(Integer, nullable=False)
    is_occupied = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    orders = relationship("Order", back_populates="table")
    reservations = relationship("Reservation", back_populates="table")