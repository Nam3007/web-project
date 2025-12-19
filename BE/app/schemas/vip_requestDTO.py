from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum
from models.vip_request import VipRequestStatus

class VipRequestBase(BaseModel):
    reason: Optional[str] = None

class VipRequestCreate(VipRequestBase):
    customer_id: int

class VipRequestUpdate(BaseModel):
    status: VipRequestStatus

class VipRequestResponse(VipRequestBase):
    id: int
    customer_id: int
    created_at: datetime
    updated_at: datetime
    status: VipRequestStatus
    customer_name: Optional[str] = None

    class Config:
        from_attributes = True
