from typing import List
from sqlalchemy.orm import Session
from models import OrderItem 

class OrderItemRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[OrderItem]:
        return db.query(OrderItem).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, order_item_id: int) -> OrderItem:
        return db.query(OrderItem).filter(OrderItem.id == order_item_id).first()

    def create(self, db: Session, order_item: OrderItem) -> OrderItem:
        db.add(order_item)
        db.commit()
        db.refresh(order_item)
        return order_item

    def update(self, db: Session, order_item: OrderItem) -> OrderItem:
        db.merge(order_item)
        db.commit()
        db.refresh(order_item)
        return order_item

    def delete(self, db: Session, order_item: OrderItem) -> None:
        db.delete(order_item)
        db.commit()
    
    def find_by_order_id(self, db: Session, order_id: int) -> List[OrderItem]:
        return db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    
    def find_by_order_and_menu(
        self,
        db: Session,
        order_id: int,
        menu_item_id: int
    ):
        return (
            db.query(OrderItem)
            .filter(
                OrderItem.order_id == order_id,
                OrderItem.menu_item_id == menu_item_id
            )
            .first()
        )
    
