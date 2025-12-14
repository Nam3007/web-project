from db import Base
from sqlalchemy import Column, Integer, String, DateTime, Enum, Numeric, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

class PaymentMethod(str, enum.Enum):
    cash = "cash"
    card = "card"
    digital_wallet = "digital_wallet"
    bank_transfer = "bank_transfer"

class PaymentStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"



class Payment(Base):
    __tablename__ = "payments"
    


    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"))
    payment_date = Column(DateTime, server_default=func.now())
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    amount_paid = Column(Numeric(10, 2), nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    transaction_id = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())

    order = relationship("Order", back_populates="payments")