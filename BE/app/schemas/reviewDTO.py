from pydantic import BaseModel,  Field
from typing import Optional
from datetime import datetime
from enum import Enum

class ReviewDTO(BaseModel):
    customer_id: int = Field(..., gt=0)
    order_id: int = Field(..., gt=0)
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    review_date: Optional[datetime] = None

class ReviewCreateDTO(ReviewDTO):
    pass

class ReviewUpdateDTO(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None
    review_date: Optional[datetime] = None

class ReviewResponse(BaseModel):
    id: int
    customer_id: int
    order_id: int
    rating: int
    comment: Optional[str]
    review_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True