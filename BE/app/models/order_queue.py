

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey,Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from db import Base
from .staff import StaffRole
from .order import Order

class OrderQueue(Base):
    __tablename__ = "order_queue"

    id                = Column(Integer, primary_key=True)
    order_id          = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True)
    required_role     = Column(Enum(StaffRole), nullable=False)   # 'chef' | 'waiter' | 'delivery_man'
    queued_at         = Column(DateTime, server_default=func.now(), nullable=False)
    dispatched_at     = Column(DateTime, nullable=True)       # NULL = still waiting
    assigned_staff_id = Column(Integer, ForeignKey("staff.id", ondelete="SET NULL"), nullable=True)

    order          = relationship("Order", back_populates="queue_entry")
    assigned_staff = relationship("Staff", foreign_keys=[assigned_staff_id])
