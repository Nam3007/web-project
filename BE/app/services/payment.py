from sqlalchemy.orm import Session
from models import Payment, PaymentStatus, PaymentMethod
from repository import PaymentRepository
from typing import List, Optional
from schemas import PaymentCreateDTO, PaymentResponse 
from services import OrderService

class PaymentService:
    def __init__(self):
        self.repository = PaymentRepository()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Payment]:
        """Get all payments with pagination"""
        return self.repository.get_all(db, skip=skip, limit=limit)
    
    def get_by_id(self, db: Session, payment_id: int) -> Optional[Payment]:
        """Get payment by ID"""
        return self.repository.get_by_id(db, payment_id)
    
    def create(self, db: Session, payment_data: PaymentCreateDTO) -> Payment:
        """Create new payment"""
        OrderServiceInstance = OrderService()
        amount = OrderServiceInstance.get_amounts_paid_by_order_id(db, payment_data.order_id)
        payment = Payment(
            order_id=payment_data.order_id,
            payment_method = payment_data.payment_method,
            amount_paid = amount,
        )
        
        return self.repository.create(db, payment)
    
    
    def delete(self, db: Session, payment_id: int) -> bool:
        """Delete payment"""
        payment = self.repository.get_by_id(db, payment_id)
        if not payment:
            return False
        self.repository.delete(db, payment)
        return True
    
    def get_by_order_id(self, db: Session, order_id: int) -> List[Payment]:
        """Get payments by order ID"""
        return self.repository.find_by_order_id(db, order_id)
    
    def get_by_status(self, db: Session, status: str) -> List[Payment]:
        """Get payments by status"""
        return self.repository.find_by_status(db, status)
    
    def get_by_transaction_id(self, db: Session, transaction_id: str) -> List[Payment]:
        """Get payments by transaction ID"""
        return self.repository.find_by_transaction_id(db, transaction_id)
    
    
    def update_payment_status(self , db: Session , payment_id: int , status: PaymentStatus) -> Optional[Payment]:
        payment = self.repository.update_payment_status(db, payment_id, status)
        
        # When payment is completed, free up the table
        if payment and status == PaymentStatus.completed:
            from models import Table, Order
            order = db.query(Order).filter(Order.id == payment.order_id).first()
            if order:
                table = db.query(Table).filter(Table.id == order.table_id).first()
                if table:
                    table.is_occupied = False
                    db.add(table)
                    db.commit()
        
        return payment
    
    def update_payment_method(self , db: Session , payment_id: int , payment_method: PaymentMethod) -> Optional[Payment]:
        return self.repository.update_payment_method(db, payment_id, payment_method)