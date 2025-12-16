from typing import List
from sqlalchemy.orm import Session
from models import StaffSchedule, workDay, workShift
from schemas import StaffScheduleCreateDTO, StaffScheduleUpdateDTO

class StaffScheduleRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[StaffSchedule]:
        return db.query(StaffSchedule).offset(skip).limit(limit).all()
    
    
    def get_by_id(self, db: Session, schedule_id: int) -> StaffSchedule:
        return db.query(StaffSchedule).filter(StaffSchedule.id == schedule_id).first()

    def create(self , db: Session, schedule: StaffSchedule ) -> StaffSchedule:
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        return schedule
    
    
    def update_schedule_by_id(self,db:Session, schedule_id:int , updated_schedule:StaffScheduleUpdateDTO):
        schedule = db.query(StaffSchedule).filter(StaffSchedule.id == schedule_id).first()
        if not schedule:
            return None
        
        update_data = updated_schedule.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(schedule, key, value)
        
        db.commit()
        db.refresh(schedule)
        return schedule
    
    def delete(self, db: Session, schedule: StaffSchedule) -> None:
        db.delete(schedule)
        db.commit()
    
    def find_by_staff_id(self, db: Session, staff_id: int) -> List[StaffSchedule]:
        return db.query(StaffSchedule).filter(StaffSchedule.staff_id == staff_id).all()
    
    def find_by_day_and_shift(self, db: Session, work_day: workDay, work_shift: workShift) -> List[StaffSchedule]:
        return db.query(StaffSchedule).filter(
            StaffSchedule.work_day == work_day,
            StaffSchedule.work_shift == work_shift
        ).all()
        
    def find_by_day(self, db: Session, work_day: workDay) -> List[StaffSchedule]:
        return db.query(StaffSchedule).filter(
            StaffSchedule.work_day == work_day
        ).all()
        
    def find_by_shift(self, db: Session, work_shift: workShift) -> List[StaffSchedule]:
        return db.query(StaffSchedule).filter(
            StaffSchedule.work_shift == work_shift
        ).all()
        
    def find_by_staff_and_day(self, db: Session, staff_id: int, work_day: workDay) -> List[StaffSchedule]:
        return db.query(StaffSchedule).filter(
            StaffSchedule.staff_id == staff_id,
            StaffSchedule.work_day == work_day
        ).all()
        
    def find_by_staff_and_shift(self, db: Session, staff_id: int, work_shift: workShift) -> List[StaffSchedule]:
        return db.query(StaffSchedule).filter(
            StaffSchedule.staff_id == staff_id,
            StaffSchedule.work_shift == work_shift
        ).all()
    
    def find_by_staff_and_day_and_shift(self, db: Session, staff_id: int, work_day: workDay, work_shift: workShift) -> List[StaffSchedule]:
        return db.query(StaffSchedule).filter(
            StaffSchedule.staff_id == staff_id,
            StaffSchedule.work_day == work_day,
            StaffSchedule.work_shift == work_shift
        ).all()