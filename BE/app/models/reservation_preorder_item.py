from sqlalchemy import Column, Integer, ForeignKey, DateTime, Numeric, Text, String
from sqlalchemy.sql import func
from db import Base
from sqlalchemy.orm import relationship

class ReservationPreorderItem(Base):
    __tablename__ = "reservation_preorder_items"

    id = Column(Integer, primary_key=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id", ondelete="CASCADE"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    price_per_item = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    reservation = relationship("Reservation", back_populates="preorder_items")
    menu_item = relationship("MenuItem")
