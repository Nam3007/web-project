from typing import List
from sqlalchemy.orm import Session
from models import Customer

class CustomerRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(Customer).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, customer_id: int):
        return db.query(Customer).filter(Customer.id == customer_id).first()

    def create(self, db: Session, customer: Customer):
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer

    def update(self, db: Session, customer: Customer):
        db.merge(customer)
        db.commit()
        db.refresh(customer)
        return customer

    def delete(self, db: Session, customer: Customer):
        db.delete(customer)
        db.commit()
    
    def find_by_username(self, db: Session, username: str):
        return db.query(Customer).filter(Customer.username == username).first()
    
    def find_by_email(self, db: Session, email: str):
        return db.query(Customer).filter(Customer.email == email).first()

    def exists_by_username(self, db: Session, username: str) -> bool:
        return db.query(Customer).filter(Customer.username == username).count() > 0
    
    def exists_by_email(self, db: Session, email: str) -> bool:
        return db.query(Customer).filter(Customer.email == email).count() > 0

    def find_by_id(self, db: Session, customer_id: int):
        return db.query(Customer).filter(Customer.id == customer_id).first()
    
    def search_by_name(self, db: Session, full_name: str):
        return db.query(Customer).filter(Customer.full_name.ilike(f"%{full_name}%")).all()

    def count(self, db: Session) -> int:
        return db.query(Customer).count()