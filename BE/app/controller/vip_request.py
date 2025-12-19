from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from schemas.vip_requestDTO import VipRequestCreate, VipRequestResponse, VipRequestUpdate
from services.vip_request_service import VipRequestService

router = APIRouter()

@router.post("/", response_model=VipRequestResponse)
def create_vip_request(request: VipRequestCreate, db: Session = Depends(get_db)):
    service = VipRequestService(db)
    return service.create_request(request)

@router.get("/", response_model=List[VipRequestResponse])
def get_vip_requests(status: str = None, db: Session = Depends(get_db)):
    service = VipRequestService(db)
    return service.get_requests(status)

@router.put("/{request_id}", response_model=VipRequestResponse)
def update_vip_request_status(request_id: int, update_data: VipRequestUpdate, db: Session = Depends(get_db)):
    service = VipRequestService(db)
    return service.update_status(request_id, update_data)
