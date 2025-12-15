from typing import List
from sqlalchemy.orm import Session
from models import Payment

class PaymentRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Payment]:
        return db.query(Payment).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, payment_id: int) -> Payment:
        return db.query(Payment).filter(Payment.id == payment_id).first()

    def create(self, db: Session, payment: Payment) -> Payment:
        db.add(payment)
        db.commit()
        db.refresh(payment)
        return payment

    def update(self, db: Session, payment: Payment) -> Payment:
        db.merge(payment)
        db.commit()
        db.refresh(payment)
        return payment

    def delete(self, db: Session, payment: Payment) -> None:
        db.delete(payment)
        db.commit()
    
    def find_by_order_id(self, db: Session, order_id: int) -> List[Payment]:
        return db.query(Payment).filter(Payment.order_id == order_id).all()
    
    def find_by_status(self, db: Session, status: str) -> List[Payment]:
        return db.query(Payment).filter(Payment.payment_status == status).all()
    
    def find_by_orderid(self, db: Session, order_id: int) -> List[Payment]:
        return db.query(Payment).filter(Payment.order_id == order_id).all()
    
    def find_by_transaction_id(self, db: Session, transaction_id: str) -> List[Payment]:
        return db.query(Payment).filter(Payment.transaction_id == transaction_id).all()
    
