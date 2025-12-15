from typing import List, Optional
from sqlalchemy.orm import Session
from models import Staff
from schemas import StaffCreateDTO, StaffUpdateDTO
from core.security import hash_password
from repository import StaffRepository


class StaffService:
    def __init__(self):
        self.repository = StaffRepository()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Staff]:
        """Get all staff members with pagination"""
        return self.repository.get_all(db, skip=skip, limit=limit)

    def get_by_id(self, db: Session, staff_id: int) -> Optional[Staff]:
        """Get staff member by ID"""
        return self.repository.get_by_id(db, staff_id)
    
    def get_by_username(self, db: Session, username: str) -> Optional[Staff]:
        """Get staff member by username"""
        return self.repository.find_by_username(db, username)
    
    def get_by_email(self, db: Session, email: str) -> Optional[Staff]:
        """Get staff member by email"""
        return self.repository.find_by_email(db, email)
    
    def create(self, db: Session, staff_data: StaffCreateDTO) -> Staff:
        """
        Create new staff member with business logic validation.
        """
        # Business logic: Check if username exists
        if self.repository.exists_by_username(db, staff_data.username):
            raise ValueError("Username already exists")
        
        # Business logic: Check if email exists
        if self.repository.exists_by_email(db, staff_data.email):
            raise ValueError("Email already exists")
        
        # Business logic: Hash password
        hashed_password = hash_password(staff_data.password_hashed)
        
        # Create staff object
        staff = Staff(
            username=staff_data.username,
            password_hashed=hashed_password,
            full_name=staff_data.full_name,
            email=staff_data.email,
            phone=staff_data.phone,
            role=staff_data.role
        )
        
        # Delegate to repository
        return self.repository.create(db, staff)
    
    def delete(self, db: Session, staff_id: int) -> bool:
        """Delete staff member by ID"""
        staff = self.repository.get_by_id(db, staff_id)
        if not staff:
            return False
        self.repository.delete(db, staff)
        return True

    def search_by_name(self, db: Session, full_name: str) -> List[Staff]:
        """Search staff members by full name"""
        return self.repository.search_by_name(db, full_name)
    
    def count(self, db: Session) -> int:
        """Count total number of staff members"""
        return self.repository.count(db)
    
    def update(self, db: Session, staff_id : int , staff_data:StaffUpdateDTO) -> Staff:
        staff = self.repository.get_by_id(db, staff_id)
        if not staff:
            raise ValueError("Staff member not found")
        
        updated_staff = staff_data.model_dump(exclude_unset=True)
        
        if "email" in updated_staff:
            if self.repository.exists_by_email(db, updated_staff["email"]):
                raise ValueError("Email already exists")
        
        #hashed password if password is being updated
        # Special handling for password_hashed
        if "password_hashed" in updated_staff:
            updated_staff["password_hashed"] = hash_password(updated_staff.pop("password_hashed"))


        for key, value in updated_staff.items():
            setattr(staff, key, value)

        print("Updated staff data:", updated_staff)

        return self.repository.update(db, staff)


