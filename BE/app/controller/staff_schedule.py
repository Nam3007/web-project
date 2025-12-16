from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from services import StaffScheduleService
from schemas import StaffScheduleCreateDTO, StaffScheduleUpdateDTO, StaffScheduleResponse
from db import get_db
from models import StaffSchedule, workDay, workShift
from services import StaffScheduleService

router = APIRouter()
service = StaffScheduleService()

@router.get("/", response_model=List[StaffScheduleResponse])
async def get_all_schedules(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    schedules = service.get_all(db, skip, limit)
    return schedules

@router.get("/{schedule_id}", response_model=StaffScheduleResponse)
async def get_schedule_by_id(schedule_id: int, db: Session = Depends(get_db)):
    schedule = service.get_by_id(db, schedule_id)
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return schedule

@router.post("/", response_model=StaffScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(schedule_data: StaffScheduleCreateDTO, db: Session = Depends(get_db)):
    schedule = service.create(db, schedule_data)
    return schedule

@router.put("/{schedule_id}", response_model=StaffScheduleResponse)
async def update_schedule(schedule_id: int, updated_schedule: StaffScheduleUpdateDTO, db: Session = Depends(get_db)):
    schedule = service.update_by_id(db, schedule_id, updated_schedule)
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return schedule

@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    success = service.delete(db, schedule_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return

@router.get("/staff/{staff_id}", response_model=List[StaffScheduleResponse])
async def get_schedules_by_staff_id(staff_id: int, db: Session = Depends(get_db)):
    schedules = service.find_by_staff_id(db, staff_id)
    return schedules

@router.get("/day/{work_day}/shift/{work_shift}", response_model=List[StaffScheduleResponse])
async def get_schedules_by_day_and_shift(work_day: workDay, work_shift: workShift, db: Session = Depends(get_db)):
    schedules = service.find_by_day_and_shift(db, work_day, work_shift)
    return schedules

@router.get("/day/{work_day}", response_model=List[StaffScheduleResponse])
async def get_schedules_by_day(work_day: workDay, db: Session = Depends(get_db)):
    schedules = service.find_by_day(db, work_day)
    return schedules

@router.get("/shift/{work_shift}", response_model=List[StaffScheduleResponse])
async def get_schedules_by_shift(work_shift: workShift, db: Session = Depends(get_db)):
    schedules = service.find_by_shift(db, work_shift)
    return schedules

@router.get("/staff/{staff_id}/day/{work_day}", response_model=List[StaffScheduleResponse])
async def get_schedules_by_staff_and_day(staff_id: int, work_day: workDay, db: Session = Depends(get_db)):
    schedules = service.find_by_staff_and_day(db, staff_id, work_day)
    return schedules

@router.get("/staff/{staff_id}/shift/{work_shift}", response_model=List[StaffScheduleResponse])
async def get_schedules_by_staff_and_shift(staff_id: int, work_shift: workShift, db: Session = Depends(get_db)):
    schedules = service.find_by_staff_and_shift(db, staff_id, work_shift)
    return schedules

