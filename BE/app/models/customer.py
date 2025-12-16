from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.sql import func
from db import Base
import enum
from sqlalchemy.orm import relationship , mapped_column, Mapped
class CustomerRole(str, enum.Enum):
    regular_customer = "regular_customer"
    vip_customer = "vip_customer"

class Customer(Base):
    __tablename__ = "customers"


    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hashed : Mapped[str] = mapped_column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    role : Mapped[CustomerRole] = mapped_column(Enum(CustomerRole), default=CustomerRole.regular_customer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    reservations = relationship("Reservation", back_populates="customer")
    orders = relationship("Order", back_populates="customer")
    reviews = relationship("Review", back_populates="customer")

    def __repr__(self):
        return f"<Customer(id={self.id}, username={self.username}, email={self.email}, full_name={self.full_name})>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    