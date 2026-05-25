# auth.py (service)
from core.security import verify_password, create_access_token
from repository import StaffRepository, CustomerRepository
from models import staff_status, customer_status

class AuthService:
    def login(self, db, username: str, password: str):
        # ── Staff login ──────────────────────────────────────────────────
        staff = StaffRepository().find_by_username(db, username)
        if staff and verify_password(password, staff.password_hashed):
            if staff.status != staff_status.active:
                staff.status = staff_status.active
                db.add(staff)
                db.commit()
                db.refresh(staff)
            token = create_access_token({
                "sub": staff.id,
                "user_type": "staff",
                "role": staff.role,
                "full_name": staff.full_name
            })
            return {
                "access_token": token,
                "user_id": staff.id,
                "role": staff.role,
                "full_name": staff.full_name
            }

        # ── Customer login ───────────────────────────────────────────────
        customer = CustomerRepository().find_by_username(db, username)
        if customer and verify_password(password, customer.password_hashed):
            if customer.status != customer_status.active:
                customer.status = customer_status.active
                db.add(customer)
                db.commit()
                db.refresh(customer)
            token = create_access_token({
                "sub": customer.id,
                "user_type": "customer",
                "role": customer.role,
                "full_name": customer.full_name
            })
            return {
                "access_token": token,
                "user_id": customer.id,
                "role": customer.role,
                "full_name": customer.full_name
            }

        raise ValueError("Invalid credentials")
