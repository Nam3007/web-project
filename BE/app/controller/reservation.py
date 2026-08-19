from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from db import get_db
from schemas import (
    ReservationCreateDTO,
    ReservationUpdateDTO,
    ReservationAcceptDTO,
    ReservationRejectDTO,
    ReservationResponse,
    DepositConfigDTO
)
from services import ReservationService

router = APIRouter()
reservation_service = ReservationService()

@router.get("/", response_model=List[ReservationResponse])
async def get_all_reservations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all reservations (Admin)"""
    return reservation_service.get_all(db, skip=skip, limit=limit)

@router.post("/", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    data: ReservationCreateDTO,
    db: Session = Depends(get_db)
):
    """Create a new reservation with deposit and optional pre-order items (Customer)"""
    try:
        return reservation_service.create_reservation(db, data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/pending", response_model=List[ReservationResponse])
async def get_pending_reservations(db: Session = Depends(get_db)):
    """Get all pending reservations awaiting admin approval (Admin)"""
    return reservation_service.get_pending(db)

@router.get("/weekly")
async def get_weekly_reservations(
    start_date: Optional[str] = Query(None, description="Start date of the week in YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """Get reservations formatted for weekly calendar timeline (Admin/Customer/Staff)"""
    return reservation_service.get_weekly_reservations(db, start_date)

@router.get("/deposit-config", response_model=DepositConfigDTO)
async def get_deposit_config(db: Session = Depends(get_db)):
    """Get current global default deposit amount"""
    amount = reservation_service.get_deposit_config(db)
    return {"deposit_amount": amount}

@router.put("/deposit-config", response_model=DepositConfigDTO)
async def update_deposit_config(
    data: DepositConfigDTO,
    db: Session = Depends(get_db)
):
    """Update global default deposit amount (Admin)"""
    updated = reservation_service.set_deposit_config(db, data.deposit_amount)
    return {"deposit_amount": updated}

@router.get("/available-tables")
async def get_available_tables(
    reservation_date: str = Query(..., description="ISO datetime string"),
    duration_hours: float = Query(2.0, ge=1.0, le=4.0),
    number_of_guests: int = Query(1, ge=1),
    exclude_reservation_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get table availability checking capacity and the 1-hour reservation lockout rule"""
    try:
        return reservation_service.get_available_tables_for_slot(
            db, 
            reservation_date, 
            duration_hours, 
            number_of_guests, 
            exclude_reservation_id
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/customer/{customer_id}", response_model=List[ReservationResponse])
async def get_customer_reservations(
    customer_id: int,
    db: Session = Depends(get_db)
):
    """Get all reservations for a specific customer"""
    return reservation_service.get_by_customer_id(db, customer_id)

@router.get("/customer/{customer_id}/active", response_model=Optional[ReservationResponse])
async def get_active_customer_reservation(
    customer_id: int,
    db: Session = Depends(get_db)
):
    """Get active accepted reservation for customer around current time (for auto table-linking)"""
    return reservation_service.get_active_by_customer(db, customer_id)

@router.get("/staff/{staff_id}", response_model=List[ReservationResponse])
async def get_staff_reservations(
    staff_id: int,
    db: Session = Depends(get_db)
):
    """Get all reservations assigned to a waiter or chef"""
    return reservation_service.get_by_staff_id(db, staff_id)

@router.get("/{reservation_id}", response_model=ReservationResponse)
async def get_reservation_by_id(
    reservation_id: int,
    db: Session = Depends(get_db)
):
    """Get reservation details by ID"""
    r = reservation_service.get_by_id(db, reservation_id)
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    return r

@router.put("/{reservation_id}/accept", response_model=ReservationResponse)
async def accept_reservation(
    reservation_id: int,
    data: ReservationAcceptDTO,
    db: Session = Depends(get_db)
):
    """Admin accepts reservation and assigns table + multiple waiters/chefs"""
    try:
        return reservation_service.accept_reservation(db, reservation_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.put("/{reservation_id}/reject", response_model=ReservationResponse)
async def reject_reservation(
    reservation_id: int,
    data: ReservationRejectDTO,
    db: Session = Depends(get_db)
):
    """Admin rejects reservation with optional note"""
    try:
        return reservation_service.reject_reservation(db, reservation_id, data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/{reservation_id}/cancel", response_model=ReservationResponse)
async def cancel_reservation(
    reservation_id: int,
    db: Session = Depends(get_db)
):
    """Cancel reservation (Customer or Admin)"""
    try:
        return reservation_service.cancel_reservation(db, reservation_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/{reservation_id}/complete", response_model=ReservationResponse)
async def complete_reservation(
    reservation_id: int,
    db: Session = Depends(get_db)
):
    """Complete reservation (Waiter or Admin)"""
    try:
        return reservation_service.complete_reservation(db, reservation_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
