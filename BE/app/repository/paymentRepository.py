from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Payment, PaymentStatus, PaymentMethod

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
    
    def update_payment_status(self , db: Session , payment_id: int , status: PaymentStatus ) -> Payment:
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if payment:
            payment.payment_status = status
            db.commit()
            db.refresh(payment)
        return payment
    
    def update_payment_method(self , db: Session , payment_id: int , payment_method: PaymentMethod ) -> Payment:
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if payment:
            payment.payment_method = payment_method
            db.commit()
            db.refresh(payment)
        return payment
    
    def delete_by_order_id(self, db : Session , order_id: int) -> None:
        db.query(Payment).filter(Payment.order_id == order_id).delete(synchronize_session=False)
        db.commit()

    def get_revenue_in_range(self, db: Session, start_date, end_date):
        result = db.query(
            func.coalesce(func.sum(Payment.amount_paid), 0),
            func.count(Payment.id),
        ).filter(
            Payment.payment_status == PaymentStatus.completed,
            Payment.payment_date >= start_date,
            Payment.payment_date <= end_date,
        ).first()

        if not result:
            return {
                "total_revenue": 0.0,
                "payments_count": 0,
            }

        total_revenue, payments_count = result

        return {
            "total_revenue": float(total_revenue or 0),
            "payments_count": int(payments_count or 0),
        }

