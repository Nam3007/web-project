from sqlalchemy.orm import Session
from typing import List, Optional

from models import Customer,CustomerRole
from schemas import CustomerCreateDTO, CustomerUpdateDTO
from core.security import hash_password
from repository import CustomerRepository


class CustomerService:

    def __init__(self):
        self.repository = CustomerRepository()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Customer]:
        """Get all customers with pagination"""
        return self.repository.get_all(db, skip=skip, limit=limit)
    
    def get_by_id(self, db: Session, customer_id: int) -> Optional[Customer]:
        """Get customer by ID"""
        return self.repository.get_by_id(db, customer_id)
    
    def get_by_username(self, db: Session, username: str) -> Optional[Customer]:
        """Get customer by username"""
        return self.repository.find_by_username(db, username)
    
    def get_by_email(self, db: Session, email: str) -> Optional[Customer]:
        """Get customer by email"""
        return self.repository.find_by_email(db, email)
    
    def create(self, db: Session, customer_data: CustomerCreateDTO) -> Customer:
        """
        Create new customer with business logic validation.
        """
        # Business logic: Check if username exists
        if self.repository.exists_by_username(db, customer_data.username):
            raise ValueError("Username already exists")
        
        # Business logic: Check if email exists
        if self.repository.exists_by_email(db, customer_data.email):
            raise ValueError("Email already exists")
        
        # Business logic: Hash password
        hashed_password = hash_password(customer_data.password_hashed)
        
        # Create customer object
        customer = Customer(
            username=customer_data.username,
            password_hashed=hashed_password,
            full_name=customer_data.full_name,
            email=customer_data.email,
            phone=customer_data.phone
        )
        
        # Delegate to repository
        return self.repository.create(db, customer)
    
    
    def delete(self, db: Session, customer_id: int) -> bool:
        """Delete customer"""
        customer = self.repository.find_by_id(db, customer_id)
        if not customer:
            return False
        
        # Business logic: Could add checks here
        # e.g., prevent deletion if customer has active orders
        
        self.repository.delete(db, customer)
        return True
    
    def search_by_name(self, db: Session, name: str) -> List[Customer]:
        """Search customers by name"""
        return self.repository.search_by_name(db, name )
    
    def get_total_count(self, db: Session) -> int:
        """Get total number of customers"""
        return self.repository.count(db)
    
    def update(self, db: Session, customer_id: int, customer_data: CustomerUpdateDTO) -> Customer:
        """Update customer information"""
        customer = self.repository.get_by_id(db, customer_id)
        updated_customer = customer_data.model_dump(exclude_unset=True)

        if "email" in updated_customer:
            if self.repository.exists_by_email(db, updated_customer["email"]):
                raise ValueError("Email already exists")
        # Update fields
        for key, value in updated_customer.items():
            setattr(customer, key, value)
        
        print("Updated customer data:", updated_customer)


        return self.repository.update(db, customer)
    
    def update_customer_role(self,db , customer_id: int , new_role : CustomerRole) -> Customer:
        return self.repository.update_role(db, customer_id, new_role)