from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from models import Staff
from schemas import StaffCreateDTO, StaffResponse, StaffUpdateDTO
from services import StaffService

router = APIRouter()
# Initialize service
staff_service = StaffService()

@router.get("/", response_model=List[StaffResponse])
def get_all_staff(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    """Get all staff members"""
    staff_members = staff_service.get_all(db, skip=skip, limit=limit)
    return staff_members

@router.get("/{staff_id}", response_model=StaffResponse)
def get_staff(staff_id: int, db: Session = Depends(get_db)):
    """Get staff member by ID"""
    staff = staff_service.get_by_id(db, staff_id)
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )
    return staff

@router.post("/", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
def create_staff(   
    staff_data: StaffCreateDTO,
    db: Session = Depends(get_db)
):
    """Create new staff member"""
    try:
        return staff_service.create(db, staff_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    """Delete staff member"""
    success = staff_service.delete(db, staff_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )
    return None

@router.put("/{staff_id}", response_model=StaffResponse)
def update_staff(
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
    # Update fields

    updated_staff = staff_service.update(db, staff_id, staff_data)
    return updated_staff