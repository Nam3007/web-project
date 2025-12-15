from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class CustomerRole(str, Enum):
    regular_customer = "regular_customer"
    vip_customer = "vip_customer"

class CustomerDTO(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., max_length=100)
    email: EmailStr
    phone: Optional[str] = None

class CustomerCreateDTO(CustomerDTO):
    password_hashed: str = Field(..., min_length=6)

class CustomerUpdateDTO(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password_hashed: Optional[str] = Field(None, min_length=6)

class CustomerResponse(BaseModel):
    id: int
    username: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: CustomerRole
    created_at: datetime

    class Config:
        from_attributes = True
