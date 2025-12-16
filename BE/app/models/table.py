from db import Base
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
import enum
from sqlalchemy.orm import relationship



class Table(Base):
    __tablename__ = "tables"

    id : Mapped[int] = mapped_column(primary_key=True)
    table_number: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    table_size: Mapped[int] = mapped_column(Integer, nullable=False)
    is_occupied: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    
    orders = relationship("Order", back_populates="table")
    reservations = relationship("Reservation", back_populates="table")