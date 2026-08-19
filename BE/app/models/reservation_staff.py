from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum
from sqlalchemy.sql import func
from db import Base
from sqlalchemy.orm import relationship
from .staff import StaffRole

class ReservationStaffAssignment(Base):
    __tablename__ = "reservation_staff_assignments"

    id = Column(Integer, primary_key=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(StaffRole), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    reservation = relationship("Reservation", back_populates="staff_assignments")
    staff = relationship("Staff")
