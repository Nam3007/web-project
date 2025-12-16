from sqlalchemy.orm import Session
from models import StaffSchedule, workDay, workShift

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
    
    def create(self , db: Session, schedule_data: StaffScheduleCreateDTO ) -> StaffSchedule:
        schedule = StaffSchedule(
            staff_id=schedule_data.staff_id,
            work_day=schedule_data.work_day,
            work_shift=schedule_data.work_shift
        )
        return self.repository.create(db, schedule)
    
    def update_by_id(self, db:Session, schedule_id:int , updated_schedule:StaffScheduleUpdateDTO):
        return self.repository.update_schedule_by_id(db, schedule_id, updated_schedule)
    
    def delete(self, db: Session, schedule_id: int) -> bool:
        schedule = self.repository.get_by_id(db, schedule_id)
        if not schedule:
            return False
        self.repository.delete(db, schedule)
        return True
    
    def find_by_staff_id(self, db: Session, staff_id: int) -> List[StaffSchedule]:
        return self.repository.find_by_staff_id(db, staff_id)
    
    def find_by_day_and_shift(self, db: Session, work_day : workDay, work_shift: workShift) -> List[StaffSchedule]:
        return self.repository.find_by_day_and_shift(db, work_day, work_shift)
    
    def find_by_day(self, db: Session, work_day: workDay) -> List[StaffSchedule]:
        return self.repository.find_by_day(db, work_day)
    
    def find_by_shift(self, db: Session, work_shift: workShift) -> List[StaffSchedule]:
        return self.repository.find_by_shift(db, work_shift)
    
    def find_by_staff_and_day(self, db: Session, staff_id: int, work_day: workDay) -> List[StaffSchedule]:
        return self.repository.find_by_staff_and_day(db, staff_id, work_day)
    
    def find_by_staff_and_shift(self, db: Session, staff_id: int, work_shift: workShift) -> List[StaffSchedule]:
        return self.repository.find_by_staff_and_shift(db, staff_id, work_shift)
    
    def find_by_staff_day_and_shift(self, db: Session, staff_id: int, work_day: workDay, work_shift: workShift) -> List[StaffSchedule]:
        return self.repository.find_by_staff_and_day_and_shift(db, staff_id, work_day, work_shift)
    
    