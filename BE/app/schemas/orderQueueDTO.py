from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class OrderQueueResponse(BaseModel):
    id: int
    order_id: int
    required_role: str
    queued_at: datetime
    dispatched_at: Optional[datetime] = None
    assigned_staff_id: Optional[int] = None

    class Config:
        from_attributes = True
