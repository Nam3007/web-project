from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from models import ValidityUnit

class CouponThresholdCreateDTO(BaseModel):
    min_spend: float = Field(..., gt=0)
    discount_percentage: int = Field(..., ge=1, le=100)
    validity_duration: int = Field(default=1, gt=0)
    validity_unit: ValidityUnit = ValidityUnit.weeks
    is_active: bool = True

class CouponThresholdUpdateDTO(BaseModel):
    min_spend: Optional[float] = Field(None, gt=0)
    discount_percentage: Optional[int] = Field(None, ge=1, le=100)
    validity_duration: Optional[int] = Field(None, gt=0)
    validity_unit: Optional[ValidityUnit] = None
    is_active: Optional[bool] = None

class CouponThresholdResponseDTO(BaseModel):
    id: int
    min_spend: float
    discount_percentage: int
    validity_duration: int
    validity_unit: ValidityUnit
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CustomerCouponResponseDTO(BaseModel):
    id: int
    code: str
    customer_id: int
    discount_percentage: int
    is_used: bool
    order_id: Optional[int]
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class ApplyCouponDTO(BaseModel):
    coupon_code: str
