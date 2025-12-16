from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db import get_db
from models import Payment, PaymentStatus,PaymentMethod
from schemas import PaymentCreateDTO, PaymentResponse
from services import PaymentService


router = APIRouter()
# Initialize service
payment_service = PaymentService()

@router.get("/", response_model=list[PaymentResponse])
async def get_all_payments(
    skip:int = 0,
    limit:int = 100,
    db: Session = Depends(get_db)

):
    """Get all payments"""
    payments = payment_service.get_all(db, skip=skip, limit=limit)
    return payments

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id : int , db: Session = Depends(get_db)):
    """Get payment by ID"""
    payment = payment_service.get_by_id(db, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    return payment

@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_data: PaymentCreateDTO,
    payment_method: PaymentMethod,
    db: Session = Depends(get_db)
):
    """Create new payment"""
    try:
        payment_data.payment_method = payment_method
        return payment_service.create(db, payment_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.patch("/{payment_id}/status", response_model=PaymentResponse)
async def update_payment_status(
    payment_id: int,
    payment_status: PaymentStatus,
    db: Session = Depends(get_db)
):
    """Update payment status"""
    payment = payment_service.update_payment_status(db, payment_id,payment_status)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    return payment

@router.patch("/{payment_id}/method", response_model=PaymentResponse)
async def update_payment_method(
    payment_id: int,
    payment_method: PaymentMethod,
    db: Session = Depends(get_db)
):
    """Update payment method"""
    payment = payment_service.update_payment_method(db, payment_id, payment_method)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    return payment