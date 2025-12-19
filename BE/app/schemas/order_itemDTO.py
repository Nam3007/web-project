# schemas/order_item.py (renamed for clarity)
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class OrderItemCreateDTO(BaseModel):
    order_id: int = Field(..., gt=0)
    menu_item_id: int = Field(..., gt=0)
    quantity: int = Field(..., gt=0, description="Quantity must be at least 1")
    special_instructions: Optional[str] = None

class OrderItemUpdateDTO(BaseModel):
    quantity: Optional[int] = Field(None, gt=0)
    special_instructions: Optional[str] = None

class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    menu_item_id: int
    quantity: int
    unit_price: float
    subtotal: float
    item_name: str
    special_instructions: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}  # Pydantic v2 syntax