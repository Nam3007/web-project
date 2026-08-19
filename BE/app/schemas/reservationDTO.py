from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ReservationStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    cancelled = "cancelled"
    completed = "completed"

class PreorderItemCreateDTO(BaseModel):
    menu_item_id: int = Field(..., gt=0)
    quantity: int = Field(1, gt=0)
    notes: Optional[str] = None

class PreorderItemResponseDTO(BaseModel):
    id: int
    menu_item_id: int
    item_name: str
    item_image: Optional[str] = None
    item_price: float
    quantity: int
    subtotal: float
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class StaffAssignmentResponseDTO(BaseModel):
    id: int
    staff_id: int
    staff_name: str
    role: str

    class Config:
        from_attributes = True

class ReservationCreateDTO(BaseModel):
    customer_id: int = Field(..., gt=0)
    reservation_date: datetime
    duration_hours: float = Field(2.0, ge=1.0, le=4.0)
    number_of_guests: int = Field(..., gt=0)
    special_requests: Optional[str] = None
    deposit_amount: Optional[float] = 50000.00
    deposit_paid: Optional[bool] = True
    deposit_transaction_id: Optional[str] = None
    preorder_items: Optional[List[PreorderItemCreateDTO]] = []

class ReservationAcceptDTO(BaseModel):
    table_id: int = Field(..., gt=0)
    waiter_ids: List[int] = []
    chef_ids: List[int] = []
    admin_notes: Optional[str] = None

class ReservationRejectDTO(BaseModel):
    admin_notes: Optional[str] = None

class ReservationUpdateDTO(BaseModel):
    table_id: Optional[int] = None
    reservation_date: Optional[datetime] = None
    duration_hours: Optional[float] = None
    number_of_guests: Optional[int] = None
    status: Optional[ReservationStatus] = None
    special_requests: Optional[str] = None
    admin_notes: Optional[str] = None

class ReservationResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    table_id: Optional[int] = None
    table_number: Optional[str] = None
    reservation_date: datetime
    duration_hours: float
    number_of_guests: int
    status: ReservationStatus
    special_requests: Optional[str] = None
    deposit_amount: float
    deposit_paid: bool
    deposit_transaction_id: Optional[str] = None
    total_preorder_amount: float
    total_paid: float
    admin_notes: Optional[str] = None
    assigned_staff: List[StaffAssignmentResponseDTO] = []
    preorder_items: List[PreorderItemResponseDTO] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DepositConfigDTO(BaseModel):
    deposit_amount: float = Field(..., ge=0)
