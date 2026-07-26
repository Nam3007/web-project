from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from schemas import (
    CouponThresholdCreateDTO, 
    CouponThresholdUpdateDTO, 
    CouponThresholdResponseDTO, 
    CustomerCouponResponseDTO
)
from services import CouponService

router = APIRouter()
coupon_service = CouponService()

@router.get("/thresholds", response_model=List[CouponThresholdResponseDTO])
async def get_all_thresholds(db: Session = Depends(get_db)):
    """Admin: Get all coupon thresholds"""
    return coupon_service.get_all_thresholds(db)

@router.post("/thresholds", response_model=CouponThresholdResponseDTO, status_code=201)
async def create_threshold(
    threshold_data: CouponThresholdCreateDTO, 
    db: Session = Depends(get_db)
):
    """Admin: Create a new coupon threshold"""
    return coupon_service.create_threshold(db, threshold_data)

@router.put("/thresholds/{threshold_id}", response_model=CouponThresholdResponseDTO)
async def update_threshold(
    threshold_id: int, 
    threshold_data: CouponThresholdUpdateDTO, 
    db: Session = Depends(get_db)
):
    """Admin: Update a coupon threshold"""
    threshold = coupon_service.update_threshold(db, threshold_id, threshold_data)
    if not threshold:
        raise HTTPException(status_code=404, detail="Threshold not found")
    return threshold

@router.delete("/thresholds/{threshold_id}", status_code=204)
async def delete_threshold(threshold_id: int, db: Session = Depends(get_db)):
    """Admin: Delete a coupon threshold"""
    success = coupon_service.delete_threshold(db, threshold_id)
    if not success:
        raise HTTPException(status_code=404, detail="Threshold not found")
    return None

@router.get("/customer/{customer_id}", response_model=List[CustomerCouponResponseDTO])
async def get_customer_coupons(customer_id: int, db: Session = Depends(get_db)):
    """Customer: Get available (unused, active) coupons"""
    return coupon_service.get_customer_coupons(db, customer_id)
