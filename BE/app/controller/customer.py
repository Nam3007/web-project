from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db import get_db
from models import Customer,CustomerRole
from schemas import CustomerCreateDTO, CustomerResponse, CustomerUpdateDTO
from services import CustomerService



    
router = APIRouter()
# Initialize service
customer_service = CustomerService()
# Get all customers
@router.get("/", response_model=List[CustomerResponse])
async def get_all_customers(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
        """Get all customers"""
        customers = customer_service.get_all(db, skip=skip, limit=limit)
        return customers

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Get customer by ID"""
    customer = customer_service.get_by_id(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    return customer

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_data: CustomerCreateDTO,
    db: Session = Depends(get_db)
):
    """Create new customer"""
    try:
        return customer_service.create(db, customer_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )



@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """Delete customer"""
    success = customer_service.delete(db, customer_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    return None

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer_data: CustomerUpdateDTO,
    db: Session = Depends(get_db)
):
    """Update customer"""
    customer = customer_service.get_by_id(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="customer not found"
        )
    # Update fields

    updated_customer = customer_service.update(db, customer_id, customer_data)
    return updated_customer

@router.patch("/{customer_id}/role", response_model=CustomerResponse)
async def update_customer_role(
    customer_id: int,
    new_role: CustomerRole,
    db: Session = Depends(get_db)
):
    """Update customer role"""
    customer = customer_service.get_by_id(db, customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    try:
        updated_customer = customer_service.update_customer_role(db, customer_id, new_role)
        return updated_customer
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )