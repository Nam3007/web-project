from typing import List, Optional
from sqlalchemy.orm import Session
from models import OrderQueue
from datetime import datetime


class OrderQueueRepository:

    def enqueue(self, db: Session, order_id: int, required_role: str) -> OrderQueue:
        """Add an order to the queue. Replaces any existing entry for the same order."""
        existing = self.find_by_order_id(db, order_id)
        if existing:
            existing.dispatched_at = None
            existing.assigned_staff_id = None
            existing.required_role = required_role
            existing.queued_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing
        entry = OrderQueue(order_id=order_id, required_role=required_role)
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    def dequeue(self, db: Session, queue_entry_id: int, staff_id: int) -> Optional[OrderQueue]:
        """Mark a queue entry as dispatched with the assigned staff member."""
        entry = db.query(OrderQueue).filter(OrderQueue.id == queue_entry_id).first()
        if entry:
            entry.dispatched_at = datetime.utcnow()
            entry.assigned_staff_id = staff_id
            db.commit()
            db.refresh(entry)
        return entry

    def find_pending(self, db: Session, required_role: str) -> List[OrderQueue]:
        """Get all undispatched entries for a specific role, oldest first."""
        return (
            db.query(OrderQueue)
            .filter(
                OrderQueue.required_role == required_role,
                OrderQueue.dispatched_at == None  # noqa: E711
            )
            .order_by(OrderQueue.queued_at.asc())
            .all()
        )

    def get_all_pending(self, db: Session) -> List[OrderQueue]:
        """Get all undispatched entries across all roles, oldest first."""
        return (
            db.query(OrderQueue)
            .filter(OrderQueue.dispatched_at == None)  # noqa: E711
            .order_by(OrderQueue.queued_at.asc())
            .all()
        )

    def find_by_order_id(self, db: Session, order_id: int) -> Optional[OrderQueue]:
        return db.query(OrderQueue).filter(OrderQueue.order_id == order_id).first()

    def delete_by_order_id(self, db: Session, order_id: int) -> None:
        entry = self.find_by_order_id(db, order_id)
        if entry:
            db.delete(entry)
            db.commit()

    def get_all(self, db: Session) -> List[OrderQueue]:
        return db.query(OrderQueue).order_by(OrderQueue.queued_at.asc()).all()
