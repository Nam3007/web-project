from sqlalchemy import Column, Integer, ForeignKey, Numeric, DateTime, Enum, Text
from db import Base
from sqlalchemy.sql import func
import enum
from sqlalchemy.orm import relationship


class OrderStatus(str, enum.Enum):
    pending = "pending"
    preparing = "preparing"
    ready = "ready"
    served = "served"
    paid = "paid"
    cancelled = "cancelled"

class PaymentMethod(str, enum.Enum):
    cash = "cash"
    card = "card"
    digital_wallet = "digital_wallet"
    bank_transfer = "bank_transfer"

class Order(Base):
    __tablename__ = "orders"
    __table_args__ = {'schema': 'restaurant'}
    

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"))
    table_id = Column(Integer, ForeignKey("tables.id", ondelete="CASCADE"))
    staff_id = Column(Integer, ForeignKey("staff.id", ondelete="SET NULL"))
    order_date = Column(DateTime, server_default=func.now())
    status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    total_amount = Column(Numeric(10, 2), default=0)
    discount_amount = Column(Numeric(10, 2), default=0)
    final_amount = Column(Numeric(10, 2), default=0)
    payment_method = Column(Enum(PaymentMethod))
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="orders")
    staff = relationship("Staff", back_populates="orders")
    table = relationship("Table", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="order")

    
