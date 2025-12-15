from pydantic import BaseModel,  Field
from typing import Optional
from datetime import datetime
from enum import Enum

class TableDTO(BaseModel):
    table_number: int = Field(..., gt=0)
    table_size: int = Field(..., gt=0)
    is_occupied: Optional[bool] = False
    created_at: Optional[datetime] = None

class TableCreateDTO(TableDTO):
    pass

class TableUpdateDTO(BaseModel):
    is_occupied: Optional[bool] = None

class TableResponse(BaseModel):
    id: int
    table_number: int
    table_size: int
    is_occupied: bool
    created_at: datetime

    class Config:
        from_attributes = True