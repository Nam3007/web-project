from sqlalchemy import Column, Integer, ForeignKey, Numeric, DateTime, Enum, String, Boolean
from db import Base
from sqlalchemy.sql import func
import enum
from sqlalchemy.orm import relationship

class ValidityUnit(str, enum.Enum):
    days = "days"
    weeks = "weeks"
    months = "months"

class CouponThreshold(Base):
    __tablename__ = "coupon_thresholds"

    id = Column(Integer, primary_key=True)
    min_spend = Column(Numeric(10, 2), nullable=False)
    discount_percentage = Column(Integer, nullable=False)
    validity_duration = Column(Integer, default=1, nullable=False)
    validity_unit = Column(Enum(ValidityUnit), default=ValidityUnit.weeks, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class CustomerCoupon(Base):
    __tablename__ = "customer_coupons"

    id = Column(Integer, primary_key=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    discount_percentage = Column(Integer, nullable=False)
    is_used = Column(Boolean, default=False, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True) # Order where it was used
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    customer = relationship("Customer", backref="coupons")
    order = relationship("Order", backref="coupon_used")
