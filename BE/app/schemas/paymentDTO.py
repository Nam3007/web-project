from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from models import PaymentMethod, PaymentStatus


class PaymentCreateDTO(BaseModel):
    order_id: int = Field(..., gt=0)
    payment_method : PaymentMethod


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    payment_date: datetime
    payment_method: PaymentMethod
    amount_paid: float
    payment_status: PaymentStatus
    transaction_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class VietQRConfig(BaseModel):
    bank_id: str
    account_no: str
    account_name: str


class PaymentVerificationResponse(BaseModel):
    payment_id: int
    payment_status: PaymentStatus
    completed: bool
    transaction_id: Optional[str] = None


class MonthRevenueBreakdown(BaseModel):
    month: int
    month_name: str
    start_date: datetime
    end_date: datetime
    total_revenue: float
    payments_count: int


class DailyRevenueBreakdown(BaseModel):
    date: str
    total_revenue: float
    payments_count: int


class QuarterRevenueBreakdown(BaseModel):
    quarter: int
    start_date: datetime
    end_date: datetime
    total_revenue: float
    payments_count: int
    monthly_breakdown: list[MonthRevenueBreakdown] = Field(default_factory=list)


class RevenueSummaryResponse(BaseModel):
    period: str
    start_date: datetime
    end_date: datetime
    total_revenue: float
    payments_count: int
    year: Optional[int] = None
    quarter: Optional[int] = None
    quarterly_breakdown: list[QuarterRevenueBreakdown] = Field(default_factory=list)
    monthly_breakdown: list[MonthRevenueBreakdown] = Field(default_factory=list)
    daily_breakdown: list[DailyRevenueBreakdown] = Field(default_factory=list)
