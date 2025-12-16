from schemas import OrderCreateDTO, OrderUpdateDTO
from sqlalchemy.orm import Session
from models import Order,OrderStatus
from typing import List
from repository import OrderRepository,OrderItemRepository

class OrderService:
    def __init__(self):
        self.repository = OrderRepository()
        self.order_item_repository = OrderItemRepository()
    
    def recalculate_order_total(self, db: Session, order_id: int):
        total = self.repository.calculate_total_amount(db, order_id)

        order = self.repository.get_by_id(db, order_id)
        order.total_amount = total
        order.final_amount = total - order.discount_amount

        self.repository.update(db, order)
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Order]:
        return self.repository.get_all(db, skip, limit)
    
    def get_by_id(self, db: Session, order_id: int) -> Order:
        return self.repository.get_by_id(db, order_id)
    
    def create(self, db: Session, order_data: OrderCreateDTO) -> Order:
        order = Order(
        customer_id=order_data.customer_id,
        table_id=order_data.table_id,
        staff_id=order_data.staff_id,
        notes=order_data.notes
        )
        return self.repository.create(db, order)
    
    def update(self, db: Session, order_id: int, order_data: OrderUpdateDTO) -> Order:
        order = self.get_by_id(db, order_id)

        for key, value in order_data.model_dump(exclude_unset=True).items():
            setattr(order, key, value)
        
        return self.repository.update(db, order)
    
    def delete(self, db: Session, order_id: int) -> bool:
        order = self.get_by_id(db, order_id)
        if not order:
            return False
        self.repository.delete(db, order)
        return True
    
    def find_by_customer_id(self, db: Session, customer_id: int) -> List[Order]:
        return self.repository.find_by_customer_id(db, customer_id)
    
    def get_amounts_paid_by_order_id(self, db: Session , order_id: int) ->float:
        return self.repository.calculate_total_amount(db, order_id)
    
    def find_by_status(self, db: Session, status: OrderStatus) -> List[Order]:
        return self.repository.find_by_status(db, status)