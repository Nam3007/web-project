from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class StaffRole(str, Enum):
    waiter = "waiter"
    chef = "chef"
    cashier = "cashier"
    admin = "admin"

class StaffDTO(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    role: StaffRole = StaffRole.waiter
    salary: Optional[float] = None

class StaffCreateDTO(StaffDTO):
    password_hashed: str = Field(..., min_length=6)

class StaffUpdateDTO(BaseModel):
    full_name: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[StaffRole] = None
    password_hashed: Optional[str] = Field(None, min_length=6)
    salary: Optional[float] = None

class StaffResponse(BaseModel):
    id: int
    username: str
    full_name: str
    email: EmailStr
    phone: Optional[str]
    role: StaffRole
    salary: Optional[float]
    hire_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True

