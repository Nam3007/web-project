from pydantic import BaseModel,Field
from typing import Optional
from datetime import datetime
from enum import Enum

class workShift(str, Enum):
    morning = "morning"
    afternoon = "afternoon"
    evening = "evening"
    night = "night"

class workDay(str, Enum):
    mon = "mon"
    tue = "tue"
    wed = "wed"
    thu = "thu"
    fri = "fri"
    sat = "sat"
    sun = "sun"

class StaffScheduleDTO(BaseModel):
    staff_id: int = Field(..., gt=0)
    work_day: workDay
    work_shift: workShift
    created_at: Optional[datetime] = None

class StaffScheduleCreateDTO(StaffScheduleDTO):
    pass

class StaffScheduleUpdateDTO(BaseModel):
    work_day: Optional[workDay] = None
    work_shift: Optional[workShift] = None

class StaffScheduleResponse(BaseModel):
    id: int
    staff_id: int
    work_day: workDay
    work_shift: workShift
    created_at: datetime

    class Config:
        from_attributes = True

