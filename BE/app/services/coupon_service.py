from sqlalchemy.orm import Session
from models import CouponThreshold, CustomerCoupon, ValidityUnit, Order
from schemas import CouponThresholdCreateDTO, CouponThresholdUpdateDTO, CouponThresholdResponseDTO
from repository import CouponRepository
from typing import List
from datetime import datetime, timedelta
import random
import string

class CouponService:
    def __init__(self):
        self.repository = CouponRepository()

    def get_all_thresholds(self, db: Session) -> List[CouponThreshold]:
        return self.repository.get_all_thresholds(db)

    def get_threshold_by_id(self, db: Session, threshold_id: int) -> CouponThreshold:
        return self.repository.get_threshold_by_id(db, threshold_id)

    def create_threshold(self, db: Session, threshold_data: CouponThresholdCreateDTO) -> CouponThreshold:
        return self.repository.create_threshold(db, threshold_data)

    def update_threshold(self, db: Session, threshold_id: int, threshold_data: CouponThresholdUpdateDTO) -> CouponThreshold:
        threshold = self.repository.get_threshold_by_id(db, threshold_id)
        if not threshold:
            return None
        return self.repository.update_threshold(db, threshold, threshold_data)

    def delete_threshold(self, db: Session, threshold_id: int) -> bool:
        threshold = self.repository.get_threshold_by_id(db, threshold_id)
        if not threshold:
            return False
        return self.repository.delete_threshold(db, threshold)

    def generate_coupon_code(self) -> str:
        chars = string.ascii_uppercase + string.digits
        return ''.join(random.choices(chars, k=8))

    def generate_coupon_if_eligible(self, db: Session, customer_id: int, total_spend: float) -> CustomerCoupon:
        active_thresholds = self.repository.get_active_thresholds(db)
        if not active_thresholds:
            return None

        # Thresholds are sorted by min_spend descending
        matched_threshold = None
        for threshold in active_thresholds:
            if total_spend >= threshold.min_spend:
                matched_threshold = threshold
                break

        if not matched_threshold:
            return None

        # Calculate expiration date
        now = datetime.now()
        if matched_threshold.validity_unit == ValidityUnit.days:
            expires_at = now + timedelta(days=matched_threshold.validity_duration)
        elif matched_threshold.validity_unit == ValidityUnit.weeks:
            expires_at = now + timedelta(weeks=matched_threshold.validity_duration)
        elif matched_threshold.validity_unit == ValidityUnit.months:
            # Approximation: 30 days per month
            expires_at = now + timedelta(days=matched_threshold.validity_duration * 30)
        else:
            expires_at = now + timedelta(weeks=1)

        code = self.generate_coupon_code()
        # Ensure code is unique
        while self.repository.get_coupon_by_code(db, code):
            code = self.generate_coupon_code()

        coupon = CustomerCoupon(
            code=code,
            customer_id=customer_id,
            discount_percentage=matched_threshold.discount_percentage,
            expires_at=expires_at
        )
        return self.repository.create_customer_coupon(db, coupon)

    def get_customer_coupons(self, db: Session, customer_id: int) -> List[CustomerCoupon]:
        return self.repository.get_customer_coupons(db, customer_id)

    def apply_coupon_to_order(self, db: Session, order_id: int, coupon_code: str) -> Order:
        from repository import OrderRepository
        order_repo = OrderRepository()
        order = order_repo.get_by_id(db, order_id)
        
        if not order:
            raise ValueError("Order not found")
        
        if order.status != "pending":
            raise ValueError("Can only apply coupon to pending orders")

        coupon = self.repository.get_coupon_by_code(db, coupon_code)
        if not coupon:
            raise ValueError("Coupon not found")

        if coupon.is_used:
            raise ValueError("Coupon is already used")
            
        if coupon.expires_at < datetime.now():
            raise ValueError("Coupon has expired")

        if coupon.customer_id != order.customer_id:
            raise ValueError("Coupon belongs to another customer")

        total = float(order_repo.calculate_total_amount(db, order_id))
        discount = total * (coupon.discount_percentage / 100)
        
        order.discount_amount = discount
        order.final_amount = total - discount
        
        order_repo.update(db, order)

        # Mark coupon as used and tie to order
        coupon.is_used = True
        coupon.order_id = order.id
        self.repository.update_customer_coupon(db, coupon)

        return order
