from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from models import OrderItem
from schemas import OrderItemCreateDTO, OrderItemResponse, OrderItemUpdateDTO
from services import OrderItemService

router = APIRouter()
# Initialize service
order_item_service = OrderItemService()

#get all order items
@router.get("/", response_model=List[OrderItemResponse])
async def get_all_order_items(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
        """Get all order items"""
        order_items = order_item_service.get_all(db, skip=skip, limit=limit)
        return order_items

#get all order items by order id
@router.get("/order/{order_id}", response_model=List[OrderItemResponse])
async def get_order_items_by_order_id(
        order_id: int,
        db: Session = Depends(get_db)
):
        """Get all order items by order id"""
        order_items = order_item_service.find_by_order_id(db, order_id)
        return order_items

#create order item
@router.post("/", response_model=OrderItemResponse, status_code=201)
async def create_order_item(
        order_item_data: OrderItemCreateDTO,
        db: Session = Depends(get_db)
):
        return order_item_service.create(db, order_item_data)
    


