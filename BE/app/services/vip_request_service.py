from sqlalchemy.orm import Session
from repository.vip_request_repository import VipRequestRepository
from models import VipRequestStatus, Customer, CustomerRole
from schemas.vip_requestDTO import VipRequestCreate, VipRequestUpdate
from fastapi import HTTPException

class VipRequestService:
    def __init__(self, db: Session):
        self.repository = VipRequestRepository(db)
        self.db = db # Need direct DB access for Customer Role update or should use CustomerRepository?
                     # Ideally use CustomerRepository but for now direct query or minimal usage.
                     # Let's keep it simple and update customer role here or via CustomerRepository if available.
                     # Checked list_dir, likely no customer_repo yet? "repository" has 22 children.
                     # Assuming simpler approach first.

    def create_request(self, request_dto: VipRequestCreate):
        existing = self.repository.get_by_customer_and_status(request_dto.customer_id, VipRequestStatus.pending)
        if existing:
            raise HTTPException(status_code=400, detail="You already have a pending VIP request.")
        return self.repository.create(request_dto.customer_id, request_dto.reason)

    def get_requests(self, status: str = None):
        return self.repository.get_all(status)

    def update_status(self, request_id: int, update_dto: VipRequestUpdate):
        vip_request = self.repository.get_by_id(request_id)
        if not vip_request:
            raise HTTPException(status_code=404, detail="Request not found")

        vip_request.status = update_dto.status
        
        # Business Logic: If Approved, promote customer
        if update_dto.status == VipRequestStatus.approved:
            self._promote_customer(vip_request.customer_id)

        return self.repository.update(vip_request)

    def _promote_customer(self, customer_id: int):
        # Ideally use CustomerRepository, but direct update for tight coupling in this feature is OK for now
        customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
        if customer:
            customer.role = CustomerRole.vip_customer
            self.db.add(customer)
            self.db.commit()
