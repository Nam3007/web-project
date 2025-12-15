from typing import List
from sqlalchemy.orm import Session
from models import StaffSchedule

class StaffScheduleRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[StaffSchedule]:
        return db.query(StaffSchedule).offset(skip).limit(limit).all()
    
    
    def get_by_id(self, db: Session, schedule_id: int) -> StaffSchedule:
        return db.query(StaffSchedule).filter(StaffSchedule.id == schedule_id).first()

    def create(self, db: Session, schedule_obj: StaffSchedule) -> StaffSchedule:
        db.add(schedule_obj)
        db.commit()
        db.refresh(schedule_obj)
        return schedule_obj

    def update(self, db: Session, schedule_obj: StaffSchedule) -> StaffSchedule:
        db.merge(schedule_obj)
        db.commit()
        db.refresh(schedule_obj)
        return schedule_obj

    def delete(self, db: Session, schedule_obj: StaffSchedule) -> None:
        db.delete(schedule_obj)
        db.commit()
    
    def find_by_staff_id(self, db: Session, staff_id: int) -> List[StaffSchedule]:
        return db.query(StaffSchedule).filter(StaffSchedule.staff_id == staff_id).all()
    
    def filter_by_workingDate(self, db: Session, working_date: str) -> List[StaffSchedule]:
        return db.query(StaffSchedule).filter(StaffSchedule.work_day == working_date).all()
    
    def find_by_shift(self, db: Session, shift: str) -> List[StaffSchedule]:
        return db.query(StaffSchedule).filter(StaffSchedule.work_shift == shift).all()