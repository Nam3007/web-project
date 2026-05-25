from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from models import Staff, staff_status, staff_availability
from schemas import StaffCreateDTO, StaffResponse, StaffUpdateDTO
from services import StaffService, AssignmentService

router = APIRouter()
# Initialize services
staff_service = StaffService()
assignment_service = AssignmentService()

@router.get("/", response_model=List[StaffResponse])
async def get_all_staff(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    """Get all staff members"""
    return staff_service.get_all(db, skip=skip, limit=limit)

@router.get("/{staff_id}", response_model=StaffResponse)
async def get_staff(staff_id: int, db: Session = Depends(get_db)):
    """Get staff member by ID"""
    staff = staff_service.get_by_id(db, staff_id)
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )
    return staff

@router.post("/", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
async def create_staff(
    staff_data: StaffCreateDTO,
    db: Session = Depends(get_db)
):
    """Create new staff member"""
    try:
        staff = staff_service.create(db, staff_data)
        # Attempt to dispatch queue in case the new staff is available by default
        assignment_service.dispatch_queue(db)
        return staff
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    """Delete staff member"""
    success = staff_service.delete(db, staff_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )
    return None

@router.put("/{staff_id}", response_model=StaffResponse)
async def update_staff(
    staff_id: int,
    staff_data: StaffUpdateDTO,
    db: Session = Depends(get_db)
):
    """Update staff member"""
    staff = staff_service.get_by_id(db, staff_id)
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )
    updated_staff = staff_service.update(db, staff_id, staff_data)
    # Attempt to dispatch queue in case their availability was changed
    assignment_service.dispatch_queue(db)
    return updated_staff

# ── Status toggle (admin) ───────────────────────────────────────────────────
@router.patch("/{staff_id}/status", response_model=StaffResponse)
async def update_staff_status(
    staff_id: int,
    new_status: staff_status,
    db: Session = Depends(get_db)
):
    """Toggle a staff member's active/inactive status (admin only)."""
    staff = staff_service.get_by_id(db, staff_id)
    if not staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found")
    staff.status = new_status
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff

# ── Availability toggle ─────────────────────────────────────────────────────
@router.patch("/{staff_id}/availability", response_model=StaffResponse)
async def update_staff_availability(
    staff_id: int,
    new_availability: staff_availability,
    db: Session = Depends(get_db)
):
    """Toggle a staff member's availability. Setting to 'available' triggers queue dispatch."""
    staff = staff_service.get_by_id(db, staff_id)
    if not staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found")
    staff.availability = new_availability
    db.add(staff)
    db.commit()
    db.refresh(staff)
    # Dispatch queued orders if staff just became available
    if new_availability == staff_availability.available:
        assignment_service.dispatch_queue(db)
    return staff