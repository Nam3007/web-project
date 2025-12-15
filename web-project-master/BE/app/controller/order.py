from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from models import Order
from schemas import OrderCreateDTO, OrderResponseDTO, OrderUpdateDTO
from services import OrderService

router = APIRouter()

# Initialize service
order_service = OrderService()
# Get all orders
@router.get("/", response_model=List[OrderResponseDTO])
def get_all_orders(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
        """Get all orders"""
        orders = order_service.get_all(db, skip=skip, limit=limit)
        return orders

# Get order by ID
@router.get("/{order_id}", response_model=OrderResponseDTO)
def get_order_by_id(
        order_id: int,
        db: Session = Depends(get_db)
):
        """Get order by ID"""
        order = order_service.get_by_id(db, order_id)
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return order

# Create order
@router.post("/", response_model=OrderResponseDTO, status_code=201)
def create_order(
    order_data: OrderCreateDTO,
    db: Session = Depends(get_db)
):
    """Create a new order"""
    order = order_service.create(db, order_data)
    return order

# Update order
@router.put("/{order_id}", response_model=OrderResponseDTO)
def update_order(
    order_id: int,
    order_data: OrderUpdateDTO,
    db: Session = Depends(get_db)
):
    """Update an existing order"""
    order = order_service.update(db, order_id, order_data)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# Delete order
@router.delete("/{order_id}", status_code=204)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db)
):
    """Delete an order"""
    success = order_service.delete(db, order_id)
    if not success:
        raise HTTPException(status_code=404, detail="Order not found")
    return None

# Get orders by customer ID
@router.get("/customer/{customer_id}", response_model=List[OrderResponseDTO])
def get_orders_by_customer_id(
        customer_id: int,
        db: Session = Depends(get_db)
):
        """Get orders by customer ID"""
        orders = order_service.find_by_customer_id(db, customer_id)
        return orders


