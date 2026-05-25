from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from models import Order, OrderStatus, PaymentMethod, OrderType
from schemas import OrderCreateDTO, OrderResponseDTO, OrderUpdateDTO, OrderQueueResponse
from services import OrderService, AssignmentService
from repository import OrderQueueRepository

router = APIRouter()

# Initialize services
order_service = OrderService()
assignment_service = AssignmentService()
queue_repo = OrderQueueRepository()

# ── Get all orders ──────────────────────────────────────────────────────────
@router.get("/", response_model=List[OrderResponseDTO])
async def get_all_orders(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    """Get all orders"""
    return order_service.get_all(db, skip=skip, limit=limit)

# ── Shipping endpoints (must come BEFORE /{order_id}) ──────────────────────

@router.get("/shipping/active", response_model=List[OrderResponseDTO])
async def get_active_shipping_orders(db: Session = Depends(get_db)):
    """Get shipping orders with status ready or delivering — for Delivery Man Dashboard."""
    return order_service.find_shipping_active(db)

@router.get("/shipping/customer/{customer_id}", response_model=List[OrderResponseDTO])
async def get_customer_shipping_orders(
    customer_id: int,
    db: Session = Depends(get_db)
):
    """Get a customer's shipping orders (delivering/delivered/paid)."""
    return order_service.find_shipping_by_customer(db, customer_id)

# ── Staff-scoped orders (chef / waiter / delivery dashboard) ────────────────
@router.get("/staff/{staff_id}", response_model=List[OrderResponseDTO])
async def get_orders_by_staff(
    staff_id: int,
    db: Session = Depends(get_db)
):
    """Get all active orders assigned to a specific staff member."""
    from repository import OrderRepository
    return OrderRepository().find_by_staff_id(db, staff_id)

# ── Queue management ────────────────────────────────────────────────────────
@router.get("/queue", response_model=List[OrderQueueResponse])
async def get_order_queue(db: Session = Depends(get_db)):
    """Get all orders currently waiting in the assignment queue."""
    return queue_repo.get_all_pending(db)

@router.post("/dispatch-queue", status_code=200)
async def dispatch_queue(db: Session = Depends(get_db)):
    """Manually trigger queue dispatch — assigns queued orders to available staff."""
    dispatched = assignment_service.dispatch_queue(db)
    return {"dispatched_order_ids": dispatched, "count": len(dispatched)}

# ── Get order by ID ─────────────────────────────────────────────────────────
@router.get("/{order_id}", response_model=OrderResponseDTO)
async def get_order_by_id(
        order_id: int,
        db: Session = Depends(get_db)
):
    """Get order by ID"""
    order = order_service.get_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# ── Create order ────────────────────────────────────────────────────────────
@router.post("/", response_model=OrderResponseDTO, status_code=201)
async def create_order(
    order_data: OrderCreateDTO,
    db: Session = Depends(get_db)
):
    """Create a new order"""
    return order_service.create(db, order_data)

# ── Update order ────────────────────────────────────────────────────────────
@router.put("/{order_id}", response_model=OrderResponseDTO)
async def update_order(
    order_id: int,
    order_data: OrderUpdateDTO,
    db: Session = Depends(get_db)
):
    """Update an existing order"""
    order = order_service.update(db, order_id, order_data)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# ── Customer requests completion ────────────────────────────────────────────
@router.patch("/{order_id}/request-complete", response_model=OrderResponseDTO)
async def request_complete(
    order_id: int,
    db: Session = Depends(get_db)
):
    """Customer signals they are ready for the waiter to complete the order."""
    order = order_service.get_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != OrderStatus.served:
        raise HTTPException(status_code=400, detail="Order must be in 'served' status to request completion.")
    order.completion_requested = True
    from repository import OrderRepository
    OrderRepository().update(db, order)
    return order

# ── Delete order ────────────────────────────────────────────────────────────
@router.delete("/{order_id}", status_code=204)
async def delete_order(
    order_id: int,
    db: Session = Depends(get_db)
):
    """Delete an order"""
    success = order_service.delete(db, order_id)
    if not success:
        raise HTTPException(status_code=404, detail="Order not found")
    return None

# ── Get orders by customer ID ───────────────────────────────────────────────
@router.get("/customer/{customer_id}", response_model=List[OrderResponseDTO])
async def get_orders_by_customer_id(
        customer_id: int,
        db: Session = Depends(get_db)
):
    """Get orders by customer ID"""
    return order_service.find_by_customer_id(db, customer_id)

@router.get("/status/{status}", response_model=List[OrderResponseDTO])
async def get_orders_by_status(
        status: OrderStatus,
        db: Session = Depends(get_db)
):
    """Get orders by status"""
    return order_service.find_by_status(db, status)

@router.get("/status/{status}/type/{order_type}", response_model=List[OrderResponseDTO])
async def get_orders_by_status_and_type(
        status: OrderStatus,
        order_type: OrderType,
        db: Session = Depends(get_db)
):
    """Get orders by status and type"""
    return order_service.find_by_status_and_type(db, status, order_type)