from sqlalchemy.orm import Session
from models import (
    Order, OrderStatus, OrderType, Staff,
    StaffRole, staff_availability
)
from repository import StaffRepository, OrderQueueRepository, OrderRepository


class AssignmentService:

    def __init__(self):
        self.staff_repo = StaffRepository()
        self.queue_repo = OrderQueueRepository()
        self.order_repo = OrderRepository()

    # ------------------------------------------------------------------ #
    #  STEP 1 — Called right after payment is confirmed                   #
    # ------------------------------------------------------------------ #
    def try_assign_chef(self, db: Session, order: Order) -> Order:
        """
        Try to assign an available active chef to the order.
        If none is free, put the order in the queue with required_role='chef'.
        """
        chef = self.staff_repo.find_available_by_role(db, StaffRole.chef)
        if chef:
            order.staff_id = chef.id
            order.status = OrderStatus.preparing
            chef.availability = staff_availability.unavailable
            # Clear queue entry if the order was previously queued
            self.queue_repo.delete_by_order_id(db, order.id)
            db.add(order)
            db.add(chef)
            db.commit()
            db.refresh(order)
        else:
            # Keep current status — order_queue tracks the waiting state
            db.add(order)
            db.commit()
            db.refresh(order)
            self.queue_repo.enqueue(db, order.id, required_role="chef")
        return order

    # ------------------------------------------------------------------ #
    #  STEP 2 — Called when chef marks the order "ready"                  #
    # ------------------------------------------------------------------ #
    def try_assign_next_staff(self, db: Session, order: Order) -> Order:
        """
        After chef marks ready:
          - dine_in  → assign available waiter
          - shipping → assign available delivery_man
        If none is free, put the order back in the queue.
        """
        if order.order_type == OrderType.dine_in:
            role = StaffRole.waiter
        else:
            role = StaffRole.delivery_man

        staff = self.staff_repo.find_available_by_role(db, role)
        if staff:
            order.staff_id = staff.id
            order.status = OrderStatus.ready
            staff.availability = staff_availability.unavailable
            self.queue_repo.delete_by_order_id(db, order.id)
            db.add(order)
            db.add(staff)
            db.commit()
            db.refresh(order)
        else:
            # Keep current status (ready) — order_queue tracks the waiting state
            db.add(order)
            db.commit()
            db.refresh(order)
            self.queue_repo.enqueue(db, order.id, required_role=role.value)
        return order

    # ------------------------------------------------------------------ #
    #  STEP 3 — Called whenever a staff member becomes available again    #
    # ------------------------------------------------------------------ #
    def dispatch_queue(self, db: Session) -> list:
        """
        Scan all pending queue entries and try to dispatch them to
        now-available staff. Returns list of order IDs that were dispatched.
        """
        pending = self.queue_repo.get_all_pending(db)
        dispatched = []

        for entry in pending:
            staff = self.staff_repo.find_available_by_role(db, entry.required_role)
            if not staff:
                continue  # Still no one available for this role

            order = self.order_repo.get_by_id(db, entry.order_id)
            if not order:
                continue

            order.staff_id = staff.id
            staff.availability = staff_availability.unavailable

            if entry.required_role == "chef":
                order.status = OrderStatus.preparing
            else:
                order.status = OrderStatus.ready

            self.queue_repo.dequeue(db, entry.id, staff.id)
            db.add(order)
            db.add(staff)
            db.commit()
            dispatched.append(order.id)

        return dispatched

    # ------------------------------------------------------------------ #
    #  Helper — free a staff member and attempt queue dispatch            #
    # ------------------------------------------------------------------ #
    def free_staff_and_dispatch(self, db: Session, staff_id: int) -> None:
        """
        Mark a staff member as available again, then attempt to dispatch
        any queued orders that match their role.
        """
        from models import Staff
        staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if staff:
            staff.availability = staff_availability.available
            db.add(staff)
            db.commit()
            self.dispatch_queue(db)
