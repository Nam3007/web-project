from typing import List
from sqlalchemy.orm import Session
from models import Reservation

class ReservationRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Reservation]:
        return db.query(Reservation).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, reservation_id: int) -> Reservation:
        return db.query(Reservation).filter(Reservation.id == reservation_id).first()

    def create(self, db: Session, reservation_obj: Reservation) -> Reservation:
        db.add(reservation_obj)
        db.commit()
        db.refresh(reservation_obj)
        return reservation_obj

    def update(self, db: Session, reservation_obj: Reservation) -> Reservation:
        db.merge(reservation_obj)
        db.commit()
        db.refresh(reservation_obj)
        return reservation_obj

    def delete(self, db: Session, reservation_obj: Reservation) -> None:
        db.delete(reservation_obj)
        db.commit()
    
    def find_by_customer_id(self, db: Session, customer_id: int) -> List[Reservation]:
        return db.query(Reservation).filter(Reservation.customer_id == customer_id).all()
    
    def find_by_date(self, db: Session, reservation_date: str) -> List[Reservation]:
        return db.query(Reservation).filter(Reservation.reservation_date == reservation_date).all()
    
    def find_by_status(self, db: Session, status: str) -> List[Reservation]:
        return db.query(Reservation).filter(Reservation.status == status).all()