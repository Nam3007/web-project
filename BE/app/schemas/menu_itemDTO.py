from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class ItemType(str, Enum):
    food = "food"
    drink = "drink"
    appetizer = "appetizer"
    dessert = "dessert"

class MenuItemDTO(BaseModel):
    item_name: str = Field(..., max_length=100)
    item_type: ItemType = Field( default=ItemType.food)
    item_price: float = Field(..., gt=0)
    item_description: Optional[str] = None
    item_image: Optional[str] = None
    is_available: Optional[bool] = True

class MenuItemCreateDTO(MenuItemDTO):
    pass

class MenuItemUpdateDTO(BaseModel):
    item_name: Optional[str] = Field(None, max_length=100)
    item_type: Optional[ItemType] = None
    item_price: Optional[float] = Field(None, gt=0)
    item_description: Optional[str] = None
    item_image: Optional[str] = None
    is_available: Optional[bool] = None
    

class MenuItemResponse(BaseModel):
    id: int
    item_name: str
    item_type: ItemType
    item_price: float
    item_description: Optional[str] = None
    item_image: Optional[str] = None
    is_available: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True