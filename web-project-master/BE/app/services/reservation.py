from sqlalchemy.orm import Session
from models import Reservation
from typing import List
from repository import ReservationRepository
from schemas import ReservationCreateDTO, ReservationUpdateDTO


class ReservationService:
    def __init__(self):
        self.repository = ReservationRepository()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Reservation]:
        return self.repository.get_all(db, skip, limit)
    
    def get_by_id(self, db: Session, reservation_id: int) -> Reservation:
        return self.repository.get_by_id(db, reservation_id)
    
    def create(self, db: Session, reservation_data: ReservationCreateDTO) -> Reservation:
        reservation = Reservation(
            customer_id=reservation_data.customer_id,
            table_id=reservation_data.table_id,
            reservation_date=reservation_data.reservation_date,
            duration_hours=reservation_data.duration_hours,
            number_of_guests=reservation_data.number_of_guests,
            status=reservation_data.status,
            special_requests=reservation_data.special_requests,
            created_at=reservation_data.created_at
        )
        return self.repository.create(db, reservation)
    
    def update(self, db: Session, reservation_id: int, reservation_data: ReservationUpdateDTO) -> Reservation:
        reservation = self.get_by_id(db, reservation_id)

        for key, value in reservation_data.model_dump(exclude_unset=True).items():
            setattr(reservation, key, value)
        
        return self.repository.update(db, reservation)
    
    def delete(self, db: Session, reservation_id: int) -> bool:
        reservation = self.get_by_id(db, reservation_id)
        if not reservation:
            return False
        self.repository.delete(db, reservation)
        return True
    
    def find_by_customer_id(self, db: Session, customer_id: int) -> List[Reservation]:
        return self.repository.find_by_customer_id(db, customer_id)
    
    