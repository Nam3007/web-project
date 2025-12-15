from pydantic import BaseModel,Field
from typing import Optional
from datetime import datetime
from enum import Enum

class PaymentMethod(str, Enum):
    cash = "cash"
    card = "card"
    digital_wallet = "digital_wallet"
    bank_transfer = "bank_transfer"

class PaymentStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"

class PaymentDTO(BaseModel):
    order_id: int = Field(...,gt=0)
    payment_date: Optional[datetime] = None
    payment_method: PaymentMethod
    amount_paid: float = Field(...,gt=0)
    payment_status: Optional[PaymentStatus] = PaymentStatus.pending
    transaction_id: Optional[str] = None

class PaymentCreateDTO(PaymentDTO):
    pass
class PaymentUpdateDTO(BaseModel):
    payment_method: Optional[PaymentMethod] = None
    amount_paid: Optional[float] = Field(None, gt=0)
    payment_status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = None

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
