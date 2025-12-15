from sqlalchemy import Boolean, Column, Integer, Numeric, String, DateTime, Enum, Text
from sqlalchemy.sql import func
from db import Base
import enum
from sqlalchemy.orm import relationship

class item_type(str, enum.Enum):
    food = "food"
    drink = "drink"
    appetizer = "appetizer"
    dessert = "dessert"

class MenuItem(Base):
    __tablename__ = "menu_items"
    
    

    id = Column(Integer, primary_key=True)
    item_name = Column(String(100), nullable = False)
    item_type = Column(Enum(item_type), nullable = False, default=item_type.food)
    item_price =Column(Numeric(10,2), nullable =False)
    item_description = Column(Text)
    item_image = Column(String(255))
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime,server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    order_items = relationship("OrderItem", back_populates="menu_item")