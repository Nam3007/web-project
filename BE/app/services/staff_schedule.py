from sqlalchemy.orm import Session
from models import StaffSchedule

from typing import List
from repository import StaffScheduleRepository
from schemas import StaffScheduleCreateDTO, StaffScheduleUpdateDTO

class StaffScheduleService:
    def __init__(self):
        self.repository = StaffScheduleRepository()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[StaffSchedule]:
        return self.repository.get_all(db, skip, limit)
    
    def get_by_id(self, db: Session, schedule_id: int) -> StaffSchedule:
        return self.repository.get_by_id(db, schedule_id)
    
    def create(self, db: Session, schedule_data: StaffScheduleCreateDTO) -> StaffSchedule:
        schedule = StaffSchedule(
            staff_id=schedule_data.staff_id,
            work_day = schedule_data.work_day,
            work_shift = schedule_data.work_shift,
            create_date = schedule_data.created_at
        )
        return self.repository.create(db, schedule)
    
    def update(self, db: Session, schedule_id: int, schedule_data: StaffScheduleUpdateDTO) -> StaffSchedule:
        schedule = self.get_by_id(db, schedule_id)

        for key, value in schedule_data.model_dump(exclude_unset=True).items():
            setattr(schedule, key, value)
        
        return self.repository.update(db, schedule)
    
    def delete(self, db: Session, schedule_id: int) -> bool:
        schedule = self.get_by_id(db, schedule_id)
        if not schedule:
            return False
        self.repository.delete(db, schedule)
        return True
    
    def find_by_staff_id(self, db: Session, staff_id: int) -> List[StaffSchedule]:
        return self.repository.find_by_staff_id(db, staff_id)
    
    def find_by_date(self, db: Session, shift_date: str) -> List[StaffSchedule]:
        return self.repository.filter_by_workingDate(db, shift_date)
    