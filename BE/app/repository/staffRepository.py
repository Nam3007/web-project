from typing import List
from sqlalchemy.orm import Session
from models import Staff

class StaffRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(Staff).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, staff_id: int):
        return db.query(Staff).filter(Staff.id == staff_id).first()

    def create(self, db: Session, staff: Staff):
        db.add(staff)
        db.commit()
        db.refresh(staff)
        return staff

    def update(self, db: Session, staff: Staff):
        db.merge(staff)
        db.commit()
        db.refresh(staff)
        return staff

    def delete(self, db: Session, staff: Staff):
        db.delete(staff)
        db.commit()
    
    def find_by_username(self, db: Session, username: str):
        return db.query(Staff).filter(Staff.username == username).first()
    
    def find_by_email(self, db: Session, email: str):
        return db.query(Staff).filter(Staff.email == email).first()

    def exists_by_username(self, db: Session, username: str) -> bool:
        #return true if username exists, else false
        return db.query(Staff).filter(Staff.username == username).count() > 0
    
    def exists_by_email(self, db: Session, email: str) -> bool:
        #return true if email exists, else false
        return db.query(Staff).filter(Staff.email == email).count() > 0

    
    def search_by_name(self, db: Session, full_name: str):
        return db.query(Staff).filter(Staff.full_name.ilike(f"%{full_name}%")).all()

    def count(self, db: Session) -> int:
        return db.query(Staff).count()