from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum, String
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from db import Base
import enum

class VipRequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"

class VipRequest(Base):
    __tablename__ = "vip_requests"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    status: Mapped[VipRequestStatus] = mapped_column(Enum(VipRequestStatus), default=VipRequestStatus.pending)
    reason = Column(String(255), nullable=True) # Optional reason from customer
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", backref="vip_requests")

    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "status": self.status,
            "reason": self.reason,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "customer_name": self.customer.full_name if self.customer else None
        }
