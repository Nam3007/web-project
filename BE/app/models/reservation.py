from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum, Text
from sqlalchemy.sql import func
from db import Base
import enum
from sqlalchemy.orm import relationship


class ReservationStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"


class Reservation(Base):
    __tablename__ = "reservations"
    

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"))
    table_id = Column(Integer, ForeignKey("tables.id", ondelete="CASCADE"))
    reservation_date = Column(DateTime, nullable=False)
    duration_hours = Column(Integer, default=2)
    number_of_guests = Column(Integer, nullable=False)
    status = Column(Enum(ReservationStatus), default=ReservationStatus.pending)
    special_requests = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="reservations")
    table = relationship("Table", back_populates="reservations")