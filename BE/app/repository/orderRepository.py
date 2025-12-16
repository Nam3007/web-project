from typing import List
from sqlalchemy.orm import Session
from models import Order, OrderStatus
from sqlalchemy.sql import func
from models import OrderItem

class OrderRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Order]:
        return db.query(Order).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, order_id: int) -> Order:
        return db.query(Order).filter(Order.id == order_id).first()

    def create(self, db: Session, order: Order) -> Order:
        db.add(order)
        db.commit()
        db.refresh(order)
        return order

    def update(self, db: Session, order: Order) -> Order:
        db.merge(order)
        db.commit()
        db.refresh(order)
        return order

    def delete(self, db: Session, order: Order) -> None:
        db.delete(order)
        db.commit()
    
    def find_by_customer_id(self, db: Session, customer_id: int) -> List[Order]:
        return db.query(Order).filter(Order.customer_id == customer_id).all()
    
    def find_by_status(self, db: Session, status: OrderStatus) -> List[Order]:
        return db.query(Order).filter(Order.status == status).all()
    
    def calculate_total_amount(self,db: Session , order_id:int ):
        total = (
            db.query(func.coalesce(func.sum(OrderItem.subtotal), 0))
            .filter(OrderItem.order_id == order_id)
            .scalar()
        )
        return total