from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum, Text, Numeric, Boolean, String, Float
from sqlalchemy.sql import func
from db import Base
import enum
from sqlalchemy.orm import relationship


class ReservationStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    cancelled = "cancelled"
    completed = "completed"


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    table_id = Column(Integer, ForeignKey("tables.id", ondelete="SET NULL"), nullable=True)
    reservation_date = Column(DateTime, nullable=False)
    duration_hours = Column(Float, default=2.0)
    number_of_guests = Column(Integer, nullable=False)
    status = Column(Enum(ReservationStatus), default=ReservationStatus.pending)
    special_requests = Column(Text, nullable=True)
    deposit_amount = Column(Numeric(10, 2), default=50000.00)
    deposit_paid = Column(Boolean, default=False)
    deposit_transaction_id = Column(String(100), nullable=True)
    total_preorder_amount = Column(Numeric(10, 2), default=0.00)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="reservations")
    table = relationship("Table", back_populates="reservations")
    staff_assignments = relationship("ReservationStaffAssignment", back_populates="reservation", cascade="all, delete-orphan")
    preorder_items = relationship("ReservationPreorderItem", back_populates="reservation", cascade="all, delete-orphan")