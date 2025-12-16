# auth.py (service)
from core.security import verify_password, create_access_token
from repository import StaffRepository, CustomerRepository

class AuthService:
    def login(self, db, username: str, password: str):
        staff = StaffRepository().find_by_username(db, username)
        if staff and verify_password(password, staff.password_hashed):
            token = create_access_token({
                "sub": staff.id,
                "user_type": "staff",
                "role": staff.role
            })
            return {
                "access_token": token,
                "user_id": staff.id,
                "role": staff.role
            }

        customer = CustomerRepository().find_by_username(db, username)
        if customer and verify_password(password, customer.password_hashed):
            token = create_access_token({
                "sub": customer.id,
                "user_type": "customer",
                "role": customer.role
            })
            return {
                "access_token": token,
                "user_id": customer.id,
                "role": customer.role
            }

        raise ValueError("Invalid credentials")