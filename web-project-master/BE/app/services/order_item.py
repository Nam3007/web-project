
from schemas import OrderItemCreateDTO, OrderItemUpdateDTO
from sqlalchemy.orm import Session
from models import OrderItem,MenuItem
from typing import List
from repository import OrderItemRepository,MenuItemRepository
from fastapi import HTTPException, status
from services import OrderService


class OrderItemService:
    def __init__(self):
        self.repository = OrderItemRepository()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[OrderItem]:
        return self.repository.get_all(db, skip, limit)
    
    def get_by_id(self, db: Session, order_item_id: int) -> OrderItem:
        return self.repository.get_by_id(db, order_item_id)
    
    def create(self, db: Session, data: OrderItemCreateDTO) -> OrderItem:
        menu_item_repo = MenuItemRepository()
        price = menu_item_repo.get_item_price_by_id(db, data.menu_item_id)

        existing = self.repository.find_by_order_and_menu(
            db, data.order_id, data.menu_item_id
        )

        if existing:
        # 🔁 merge quantities
            existing.quantity += data.quantity
            existing.unit_price = price  # optional: keep latest price
            existing.calculate_subtotal()
            saved_item = self.repository.update(db, existing)
        else:
        # 🆕 new row
            item = OrderItem(
            order_id=data.order_id,
            menu_item_id=data.menu_item_id,
            quantity=data.quantity,
            unit_price=price,
            special_instructions=data.special_instructions,
        )
            item.calculate_subtotal()
            saved_item = self.repository.create(db, item)

        # 🔥 always recalc order total
        order_service = OrderService()
        order_service.recalculate_order_total(db, data.order_id)

        return saved_item       


    def update(self, db: Session, order_item_id: int, order_item_data: OrderItemUpdateDTO) -> OrderItem:
        order_item = self.get_by_id(db, order_item_id)

        for key, value in order_item_data.model_dump(exclude_unset=True).items():
            setattr(order_item, key, value)
        
        return self.repository.update(db, order_item)
    
    def delete(self, db: Session, order_item_id: int) -> bool:
        order_item = self.get_by_id(db, order_item_id)
        if not order_item:
            return False
        self.repository.delete(db, order_item)
        return True
    
    def find_by_order_id(self, db: Session, order_id: int) -> List[OrderItem]:
        return self.repository.find_by_order_id(db, order_id)