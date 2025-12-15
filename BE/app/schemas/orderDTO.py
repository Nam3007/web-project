from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class OrderStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    preparing = "preparing"
    delivered = "delivered"
    cancelled = "cancelled"

class PaymentMethod(str, Enum):
    cash = "cash"
    card = "card"
    digital_wallet = "digital_wallet"
    bank_transfer = "bank_transfer"

class OrderDTO(BaseModel):
    notes: Optional[str] = None


class OrderCreateDTO(OrderDTO):
    customer_id: int
    table_id: int
    staff_id: Optional[int] = None


class OrderUpdateDTO(BaseModel):
    status: Optional[OrderStatus] = None
    payment_method: Optional[PaymentMethod] = None
    discount_amount: Optional[float] = None
    notes: Optional[str] = None


class OrderResponseDTO(OrderDTO):
    id: int
    customer_id: int
    table_id: int
    staff_id: Optional[int]

    status: OrderStatus
    total_amount: float
    discount_amount: float
    final_amount: float

    payment_method: Optional[PaymentMethod]
    order_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True
