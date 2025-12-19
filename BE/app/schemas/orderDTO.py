from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from models import OrderStatus, PaymentMethod

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
    payment_requested: Optional[bool] = None
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
    payment_requested: bool

    payment_method: Optional[PaymentMethod]
    order_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True
