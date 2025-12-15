from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class ReservationStatus(str,Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"

class ReservationDTO(BaseModel): 
    customer_id: int = Field(..., gt=0)
    table_id: int = Field(..., gt=0)
    reservation_date: datetime
    duration_hours: Optional[int] = 2
    number_of_guests: int = Field(..., gt=0)
    status: Optional[ReservationStatus] = ReservationStatus.pending
    special_requests: Optional[str] = None
    created_at: Optional[datetime] = None

class ReservationCreateDTO(ReservationDTO):
    pass

class ReservationUpdateDTO(BaseModel):
    table_id: Optional[int] = Field(None, gt=0)
    reservation_date: Optional[datetime] = None
    duration_hours: Optional[int] = None
    number_of_guests: Optional[int] = Field(None, gt=0)
    status: Optional[ReservationStatus] = None
    special_requests: Optional[str] = None
    updated_at: Optional[datetime] = None

class ReservationResponse(BaseModel):
    id: int
    customer_id: int
    table_id: int
    reservation_date: datetime
    duration_hours: int
    number_of_guests: int
    status: ReservationStatus
    special_requests: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

