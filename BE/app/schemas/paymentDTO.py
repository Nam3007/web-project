from pydantic import BaseModel,Field
from typing import Optional
from datetime import datetime
from enum import Enum
from models import PaymentMethod, PaymentStatus


class PaymentCreateDTO(BaseModel):
    order_id: int = Field(..., gt=0)
    payment_method : PaymentMethod

class PaymentMethodUpdateDTO(BaseModel):
    payment_method: PaymentMethod
    
class PaymentStatusUpdateDTO(BaseModel):
    payment_status: PaymentStatus

class PaymentResponse(BaseModel):
    id: int
    order_id: int
    payment_date: datetime
    payment_method: PaymentMethod
    amount_paid: float
    payment_status: PaymentStatus
    transaction_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
