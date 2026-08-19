from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, joinedload
from models import Reservation, ReservationStatus, ReservationStaffAssignment, ReservationPreorderItem, RestaurantConfig

class ReservationRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Reservation]:
        return (
            db.query(Reservation)
            .options(
                joinedload(Reservation.customer),
                joinedload(Reservation.table),
                joinedload(Reservation.staff_assignments).joinedload(ReservationStaffAssignment.staff),
                joinedload(Reservation.preorder_items).joinedload(ReservationPreorderItem.menu_item)
            )
            .order_by(Reservation.reservation_date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_id(self, db: Session, reservation_id: int) -> Optional[Reservation]:
        return (
            db.query(Reservation)
            .options(
                joinedload(Reservation.customer),
                joinedload(Reservation.table),
                joinedload(Reservation.staff_assignments).joinedload(ReservationStaffAssignment.staff),
                joinedload(Reservation.preorder_items).joinedload(ReservationPreorderItem.menu_item)
            )
            .filter(Reservation.id == reservation_id)
            .first()
        )

    def create(self, db: Session, reservation_obj: Reservation) -> Reservation:
        db.add(reservation_obj)
        db.commit()
        db.refresh(reservation_obj)
        return self.get_by_id(db, reservation_obj.id)

    def update(self, db: Session, reservation_obj: Reservation) -> Reservation:
        db.merge(reservation_obj)
        db.commit()
        db.refresh(reservation_obj)
        return self.get_by_id(db, reservation_obj.id)

    def delete(self, db: Session, reservation_obj: Reservation) -> None:
        db.delete(reservation_obj)
        db.commit()
    
    def find_by_customer_id(self, db: Session, customer_id: int) -> List[Reservation]:
        return (
            db.query(Reservation)
            .options(
                joinedload(Reservation.customer),
                joinedload(Reservation.table),
                joinedload(Reservation.staff_assignments).joinedload(ReservationStaffAssignment.staff),
                joinedload(Reservation.preorder_items).joinedload(ReservationPreorderItem.menu_item)
            )
            .filter(Reservation.customer_id == customer_id)
            .order_by(Reservation.reservation_date.desc())
            .all()
        )
    
    def find_by_status(self, db: Session, status: str) -> List[Reservation]:
        return (
            db.query(Reservation)
            .options(
                joinedload(Reservation.customer),
                joinedload(Reservation.table),
                joinedload(Reservation.staff_assignments).joinedload(ReservationStaffAssignment.staff),
                joinedload(Reservation.preorder_items).joinedload(ReservationPreorderItem.menu_item)
            )
            .filter(Reservation.status == status)
            .order_by(Reservation.reservation_date.asc())
            .all()
        )

    def find_pending(self, db: Session) -> List[Reservation]:
        return self.find_by_status(db, ReservationStatus.pending)

    def find_by_date_range(self, db: Session, start_date: datetime, end_date: datetime) -> List[Reservation]:
        return (
            db.query(Reservation)
            .options(
                joinedload(Reservation.customer),
                joinedload(Reservation.table),
                joinedload(Reservation.staff_assignments).joinedload(ReservationStaffAssignment.staff),
                joinedload(Reservation.preorder_items).joinedload(ReservationPreorderItem.menu_item)
            )
            .filter(
                Reservation.reservation_date >= start_date,
                Reservation.reservation_date <= end_date,
                Reservation.status.in_([ReservationStatus.pending, ReservationStatus.accepted, ReservationStatus.completed])
            )
            .order_by(Reservation.reservation_date.asc())
            .all()
        )

    def find_by_staff_id(self, db: Session, staff_id: int) -> List[Reservation]:
        return (
            db.query(Reservation)
            .join(ReservationStaffAssignment, Reservation.id == ReservationStaffAssignment.reservation_id)
            .options(
                joinedload(Reservation.customer),
                joinedload(Reservation.table),
                joinedload(Reservation.staff_assignments).joinedload(ReservationStaffAssignment.staff),
                joinedload(Reservation.preorder_items).joinedload(ReservationPreorderItem.menu_item)
            )
            .filter(
                ReservationStaffAssignment.staff_id == staff_id,
                Reservation.status.in_([ReservationStatus.accepted, ReservationStatus.completed])
            )
            .order_by(Reservation.reservation_date.desc())
            .all()
        )

    def find_active_for_customer(self, db: Session, customer_id: int) -> Optional[Reservation]:
        """Find an accepted reservation for customer around current time (within +/- 3 hours) or today"""
        now = datetime.now()
        start_window = now - timedelta(hours=4)
        end_window = now + timedelta(hours=6)
        
        return (
            db.query(Reservation)
            .options(
                joinedload(Reservation.customer),
                joinedload(Reservation.table),
                joinedload(Reservation.staff_assignments).joinedload(ReservationStaffAssignment.staff),
                joinedload(Reservation.preorder_items).joinedload(ReservationPreorderItem.menu_item)
            )
            .filter(
                Reservation.customer_id == customer_id,
                Reservation.status == ReservationStatus.accepted,
                Reservation.reservation_date >= start_window,
                Reservation.reservation_date <= end_window
            )
            .order_by(Reservation.reservation_date.asc())
            .first()
        )

    def find_table_conflicts(self, db: Session, table_id: int, start_time: datetime, duration_hours: float, exclude_id: Optional[int] = None) -> bool:
        """
        Check if table has overlapping reservation.
        Includes 1-hour lockout buffer before the reservation.
        """
        buffer_start = start_time - timedelta(hours=1)
        end_time = start_time + timedelta(hours=duration_hours)

        query = db.query(Reservation).filter(
            Reservation.table_id == table_id,
            Reservation.status == ReservationStatus.accepted
        )
        if exclude_id:
            query = query.filter(Reservation.id != exclude_id)

        # A collision occurs if other_start - 1h < end_time AND other_end > buffer_start
        existing_res = query.all()
        for res in existing_res:
            res_buffer_start = res.reservation_date - timedelta(hours=1)
            res_end = res.reservation_date + timedelta(hours=res.duration_hours or 2.0)
            if max(buffer_start, res_buffer_start) < min(end_time, res_end):
                return True
        return False

    def get_deposit_config(self, db: Session) -> float:
        config = db.query(RestaurantConfig).filter(RestaurantConfig.config_key == "reservation_deposit").first()
        if config:
            try:
                return float(config.config_value)
            except ValueError:
                return 50000.00
        return 50000.00

    def set_deposit_config(self, db: Session, amount: float) -> float:
        config = db.query(RestaurantConfig).filter(RestaurantConfig.config_key == "reservation_deposit").first()
        if not config:
            config = RestaurantConfig(
                config_key="reservation_deposit",
                config_value=str(amount),
                description="Default deposit amount required for customer reservations"
            )
            db.add(config)
        else:
            config.config_value = str(amount)
        db.commit()
        return amount