from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, String, DateTime, Enum, UniqueConstraint 
from sqlalchemy.sql import func
from db import Base
import enum
import datetime
from sqlalchemy.orm import relationship

class workShift(str, enum.Enum):
    morning = "morning"
    afternoon = "afternoon"
    evening = "evening"

class workDay(str, enum.Enum):
    mon = "mon"
    tue = "tue"
    wed = "wed"
    thu = "thu"
    fri = "fri"
    sat = "sat"
    sun = "sun"

class StaffSchedule(Base):
    __tablename__= "staff_schedules"
    __table_args__ = (
        UniqueConstraint('staff_id', 'work_day', 'work_shift'),
    )
    id = Column(Integer, primary_key=True)
    staff_id = Column(Integer, ForeignKey("staff.id", ondelete="CASCADE"))
    work_day = Column(Enum(workDay), nullable=False)
    work_shift = Column(Enum(workShift), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    staff = relationship("Staff", back_populates="schedules")