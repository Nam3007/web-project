from sqlalchemy.orm import Session
from models import Payment
from repository import PaymentRepository
from typing import List, Optional
from schemas import PaymentCreateDTO, PaymentUpdateDTO

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
        payment = Payment(
            order_id=payment_data.order_id,
            amount=payment_data.amount_paid,
            payment_status=payment_data.payment_status,
            transaction_id=payment_data.transaction_id
        )
        return self.repository.create(db, payment)
    
    def update(self, db: Session, payment_id: int, payment_data: PaymentUpdateDTO) -> Optional[Payment]:
        """Update existing payment"""
        payment = self.repository.get_by_id(db, payment_id)
        if not payment:
            return None
        
        for key, value in payment_data.model_dump(exclude_unset=True).items():
            setattr(payment, key, value)
        
        return self.repository.update(db, payment)
    
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