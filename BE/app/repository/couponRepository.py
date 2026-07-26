from sqlalchemy.orm import Session
from models import CouponThreshold, CustomerCoupon
from schemas import CouponThresholdCreateDTO, CouponThresholdUpdateDTO
from typing import List
from datetime import datetime

class CouponRepository:
    def get_all_thresholds(self, db: Session) -> List[CouponThreshold]:
        return db.query(CouponThreshold).order_by(CouponThreshold.min_spend.asc()).all()

    def get_active_thresholds(self, db: Session) -> List[CouponThreshold]:
        return db.query(CouponThreshold).filter(CouponThreshold.is_active == True).order_by(CouponThreshold.min_spend.desc()).all()

    def get_threshold_by_id(self, db: Session, threshold_id: int) -> CouponThreshold:
        return db.query(CouponThreshold).filter(CouponThreshold.id == threshold_id).first()

    def create_threshold(self, db: Session, threshold_data: CouponThresholdCreateDTO) -> CouponThreshold:
        threshold = CouponThreshold(**threshold_data.model_dump())
        db.add(threshold)
        db.commit()
        db.refresh(threshold)
        return threshold

    def update_threshold(self, db: Session, threshold: CouponThreshold, threshold_data: CouponThresholdUpdateDTO) -> CouponThreshold:
        for key, value in threshold_data.model_dump(exclude_unset=True).items():
            setattr(threshold, key, value)
        db.commit()
        db.refresh(threshold)
        return threshold

    def delete_threshold(self, db: Session, threshold: CouponThreshold) -> bool:
        db.delete(threshold)
        db.commit()
        return True

    def create_customer_coupon(self, db: Session, coupon: CustomerCoupon) -> CustomerCoupon:
        db.add(coupon)
        db.commit()
        db.refresh(coupon)
        return coupon

    def get_customer_coupons(self, db: Session, customer_id: int) -> List[CustomerCoupon]:
        now = datetime.now()
        return db.query(CustomerCoupon).filter(
            CustomerCoupon.customer_id == customer_id,
            CustomerCoupon.is_used == False,
            CustomerCoupon.expires_at > now
        ).order_by(CustomerCoupon.created_at.desc()).all()

    def get_coupon_by_code(self, db: Session, code: str) -> CustomerCoupon:
        return db.query(CustomerCoupon).filter(CustomerCoupon.code == code).first()

    def update_customer_coupon(self, db: Session, coupon: CustomerCoupon) -> CustomerCoupon:
        db.commit()
        db.refresh(coupon)
        return coupon
