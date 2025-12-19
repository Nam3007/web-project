from db import Base
from sqlalchemy import Column, Integer, ForeignKey, Numeric, Text, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from decimal import Decimal
from sqlalchemy.orm import Mapped, mapped_column

class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = (
        UniqueConstraint("order_id", "menu_item_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    menu_item_id: Mapped[int] = mapped_column(ForeignKey("menu_items.id"))

    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    special_instructions = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem", back_populates="order_items")

    def calculate_subtotal(self):
       self.subtotal = self.unit_price * self.quantity

    @property
    def item_name(self):
        return self.menu_item.item_name if self.menu_item else "Unknown"