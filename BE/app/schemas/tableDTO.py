
from pydantic import BaseModel,  Field
from typing import Optional
from datetime import datetime
from enum import Enum


class TableDTO(BaseModel):
    table_number: str = Field(..., pattern=r"^T\d{2}$")
    table_size: int = Field(..., gt=0)
    is_occupied: Optional[bool] = False
    created_at: Optional[datetime] = None

class TableCreateDTO(BaseModel):
    table_number: str = Field(..., pattern=r"^T\d{2}$")
    table_size: int = Field(..., gt=0)

class TableStatusUpdateDTO(BaseModel):
    is_occupied: Optional[bool] = None

class TableResponse(BaseModel):
    id: int
    table_number: str
    table_size: int
    is_occupied: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TableUpdateDTO(BaseModel):
    table_number: Optional[str] = Field(None, pattern=r"^T\d{2}$")
    table_size: Optional[int] = Field(None, gt=0)
    is_occupied: Optional[bool] = None
