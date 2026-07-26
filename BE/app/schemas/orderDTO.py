from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from models import OrderStatus, PaymentMethod, OrderType

class OrderDTO(BaseModel):
    notes: Optional[str] = None


class OrderCreateDTO(OrderDTO):
    customer_id: int
    table_id: Optional[int] = None
    staff_id: Optional[int] = None
    order_type: OrderType = OrderType.dine_in
    shipping_address: Optional[str] = None


class OrderUpdateDTO(BaseModel):
    status: Optional[OrderStatus] = None
    payment_method: Optional[PaymentMethod] = None
    discount_amount: Optional[float] = None
    payment_requested: Optional[bool] = None
    completion_requested: Optional[bool] = None
    notes: Optional[str] = None


class OrderResponseDTO(OrderDTO):
    id: int
    customer_id: int
    table_id: Optional[int]
    staff_id: Optional[int]
    order_type: OrderType
    shipping_address: Optional[str]

    status: OrderStatus
    total_amount: float
    discount_amount: float
    final_amount: float
    payment_requested: bool
    completion_requested: bool

    payment_method: Optional[PaymentMethod]
    order_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
