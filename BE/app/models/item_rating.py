from db import Base
from sqlalchemy import Column, Integer, Numeric, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship


class ItemRating(Base):
    __tablename__ = "item_ratings"
    __table_args__ = (
        UniqueConstraint("order_id", "menu_item_id", name="uq_item_rating_order_item"),
    )

    id = Column(Integer, primary_key=True)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Numeric(2, 1), nullable=False)  # 1.0 - 5.0, step 0.5
    review_text = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    menu_item = relationship("MenuItem", back_populates="item_ratings")
    order = relationship("Order")
    customer = relationship("Customer")
