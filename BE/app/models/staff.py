from sqlalchemy import Column, Date, Integer, Numeric, String, DateTime, Enum 
from sqlalchemy.sql import func
from db import Base
import enum
import datetime
from sqlalchemy.orm import relationship , mapped_column, Mapped
class StaffRole(str, enum.Enum):
    waiter = "waiter"
    chef = "chef"
    cashier = "cashier"
    admin = "admin"



class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hashed : Mapped[str] = mapped_column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20))
    role = Column(Enum(StaffRole), default=StaffRole.waiter)
    salary = Column(Numeric(10, 2),default=5000.00)
    hire_date = Column(Date, server_default=func.current_date())
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    schedules = relationship("StaffSchedule", back_populates="staff")
    orders = relationship("Order", back_populates="staff")
