from pydantic import BaseModel,Field
from typing import Optional
from datetime import datetime
from enum import Enum
from models import workDay, workShift



class StaffScheduleDTO(BaseModel):
    staff_id: int = Field(..., gt=0)
    work_day: workDay
    work_shift: workShift

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

