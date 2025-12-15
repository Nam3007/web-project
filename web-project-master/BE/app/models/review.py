from db import Base
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.sql import func
import enum
from sqlalchemy.orm import relationship


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"))
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"))
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    review_date = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())

    customer = relationship("Customer", back_populates="reviews")