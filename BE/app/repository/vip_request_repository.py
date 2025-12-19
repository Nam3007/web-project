from sqlalchemy.orm import Session
from models import VipRequest, VipRequestStatus
from typing import List, Optional

class VipRequestRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, customer_id: int, reason: str = None) -> VipRequest:
        new_request = VipRequest(
            customer_id=customer_id,
            reason=reason
        )
        self.db.add(new_request)
        self.db.commit()
        self.db.refresh(new_request)
        return new_request

    def get_by_customer_and_status(self, customer_id: int, status: VipRequestStatus) -> Optional[VipRequest]:
        return self.db.query(VipRequest).filter(
            VipRequest.customer_id == customer_id,
            VipRequest.status == status
        ).first()

    def get_all(self, status: str = None) -> List[VipRequest]:
        query = self.db.query(VipRequest)
        if status and status in VipRequestStatus.__members__:
            query = query.filter(VipRequest.status == VipRequestStatus[status])
        return query.all()

    def get_by_id(self, request_id: int) -> Optional[VipRequest]:
        return self.db.query(VipRequest).filter(VipRequest.id == request_id).first()

    def update(self, vip_request: VipRequest) -> VipRequest:
        self.db.add(vip_request)
        self.db.commit()
        self.db.refresh(vip_request)
        return vip_request
