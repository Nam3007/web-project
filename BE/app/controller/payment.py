from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db import get_db
from models import Payment, PaymentStatus
from schemas import PaymentCreateDTO, PaymentStatusUpdateDTO, PaymentResponse, PaymentMethodUpdateDTO
from services import PaymentService


router = APIRouter()
# Initialize service
payment_service = PaymentService()

@router.get("/", response_model=list[PaymentResponse])
def get_all_payments(
    skip:int = 0,
    limit:int = 100,
    db: Session = Depends(get_db)

):
    """Get all payments"""
    payments = payment_service.get_all(db, skip=skip, limit=limit)
    return payments

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id : int , db: Session = Depends(get_db)):
    """Get payment by ID"""
    payment = payment_service.get_by_id(db, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    return payment

@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    payment_data: PaymentCreateDTO,
    db: Session = Depends(get_db)
):
    """Create new payment"""
    try:
        return payment_service.create(db, payment_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.patch("/{payment_id}/status", response_model=PaymentResponse)
def update_payment_status(
    payment_id: int,
    payment_data: PaymentStatusUpdateDTO,
    db: Session = Depends(get_db)
):
    """Update payment status"""
    payment = payment_service.update_payment_status(db, payment_id, payment_data.payment_status)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    return payment

@router.patch("/{payment_id}/method", response_model=PaymentResponse)
def update_payment_method(
    payment_id: int,
    payment_data: PaymentMethodUpdateDTO,
    db: Session = Depends(get_db)
):
    """Update payment method"""
    payment = payment_service.update_payment_method(db, payment_id, payment_data.payment_method)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    return payment