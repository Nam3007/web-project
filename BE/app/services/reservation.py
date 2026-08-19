from sqlalchemy.orm import Session
from models import Reservation, ReservationStatus, ReservationStaffAssignment, ReservationPreorderItem, MenuItem, Table, Staff, StaffRole
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from repository import ReservationRepository, TableRepository
from schemas import (
    ReservationCreateDTO,
    ReservationUpdateDTO,
    ReservationAcceptDTO,
    ReservationRejectDTO,
    ReservationResponse,
    StaffAssignmentResponseDTO,
    PreorderItemResponseDTO
)

class ReservationService:
    def __init__(self):
        self.repository = ReservationRepository()
        self.table_repo = TableRepository()
    
    def _to_response_dto(self, r: Reservation) -> Dict[str, Any]:
        if not r:
            return None
        
        assigned_staff_dtos = []
        if hasattr(r, 'staff_assignments') and r.staff_assignments:
            for sa in r.staff_assignments:
                staff_name = sa.staff.full_name if sa.staff else f"Staff #{sa.staff_id}"
                assigned_staff_dtos.append({
                    "id": sa.id,
                    "staff_id": sa.staff_id,
                    "staff_name": staff_name,
                    "role": sa.role.value if hasattr(sa.role, 'value') else str(sa.role)
                })

        preorder_dtos = []
        if hasattr(r, 'preorder_items') and r.preorder_items:
            for pi in r.preorder_items:
                item_name = pi.menu_item.item_name if pi.menu_item else "Custom Item"
                item_image = pi.menu_item.item_image if pi.menu_item else None
                preorder_dtos.append({
                    "id": pi.id,
                    "menu_item_id": pi.menu_item_id,
                    "item_name": item_name,
                    "item_image": item_image,
                    "item_price": float(pi.price_per_item),
                    "quantity": pi.quantity,
                    "subtotal": float(pi.subtotal),
                    "notes": pi.notes
                })

        deposit = float(r.deposit_amount or 0.0)
        preorder_total = float(r.total_preorder_amount or 0.0)
        total_paid = deposit + preorder_total

        return {
            "id": r.id,
            "customer_id": r.customer_id,
            "customer_name": r.customer.full_name if r.customer else None,
            "customer_phone": r.customer.phone if r.customer else None,
            "customer_email": r.customer.email if r.customer else None,
            "table_id": r.table_id,
            "table_number": r.table.table_number if r.table else None,
            "reservation_date": r.reservation_date,
            "duration_hours": float(r.duration_hours or 2.0),
            "number_of_guests": r.number_of_guests,
            "status": r.status.value if hasattr(r.status, 'value') else str(r.status),
            "special_requests": r.special_requests,
            "deposit_amount": deposit,
            "deposit_paid": bool(r.deposit_paid),
            "deposit_transaction_id": r.deposit_transaction_id,
            "total_preorder_amount": preorder_total,
            "total_paid": total_paid,
            "admin_notes": r.admin_notes,
            "assigned_staff": assigned_staff_dtos,
            "preorder_items": preorder_dtos,
            "created_at": r.created_at or datetime.now(),
            "updated_at": r.updated_at or datetime.now()
        }

    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        reservations = self.repository.get_all(db, skip, limit)
        return [self._to_response_dto(r) for r in reservations]
    
    def get_by_id(self, db: Session, reservation_id: int) -> Optional[Dict[str, Any]]:
        r = self.repository.get_by_id(db, reservation_id)
        if not r:
            return None
        return self._to_response_dto(r)
    
    def create_reservation(self, db: Session, data: ReservationCreateDTO) -> Dict[str, Any]:
        # 1. Fetch current deposit amount config if not set
        deposit_amount = data.deposit_amount if data.deposit_amount is not None else self.repository.get_deposit_config(db)
        
        # 2. Calculate pre-order items subtotal and prepare items
        preorder_items_objs = []
        total_preorder = 0.0

        if data.preorder_items:
            for item in data.preorder_items:
                menu_item = db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
                if menu_item:
                    price = float(menu_item.item_price)
                    subtotal = price * item.quantity
                    total_preorder += subtotal
                    preorder_items_objs.append(
                        ReservationPreorderItem(
                            menu_item_id=item.menu_item_id,
                            quantity=item.quantity,
                            price_per_item=price,
                            subtotal=subtotal,
                            notes=item.notes
                        )
                    )

        # 3. Create Reservation
        reservation = Reservation(
            customer_id=data.customer_id,
            table_id=None,  # Admin assigns table on accept
            reservation_date=data.reservation_date,
            duration_hours=data.duration_hours,
            number_of_guests=data.number_of_guests,
            status=ReservationStatus.pending,
            special_requests=data.special_requests,
            deposit_amount=deposit_amount,
            deposit_paid=True, # Paid upfront via QR
            deposit_transaction_id=data.deposit_transaction_id,
            total_preorder_amount=total_preorder,
            preorder_items=preorder_items_objs
        )

        saved = self.repository.create(db, reservation)
        return self._to_response_dto(saved)
    
    def accept_reservation(self, db: Session, reservation_id: int, accept_data: ReservationAcceptDTO) -> Dict[str, Any]:
        r = self.repository.get_by_id(db, reservation_id)
        if not r:
            raise ValueError("Reservation not found")
        
        # Check table
        table = db.query(Table).filter(Table.id == accept_data.table_id).first()
        if not table:
            raise ValueError("Selected table does not exist")
        
        if table.table_size < r.number_of_guests:
            # Still allowed or warning, but let admin override
            pass

        # Check conflict with other accepted reservations (including 1 hour lockout buffer)
        has_conflict = self.repository.find_table_conflicts(
            db, 
            accept_data.table_id, 
            r.reservation_date, 
            r.duration_hours or 2.0, 
            exclude_id=r.id
        )
        if has_conflict:
            raise ValueError(f"Table {table.table_number} is already booked or within the 1-hour reservation buffer during this time.")

        # Update reservation
        r.table_id = accept_data.table_id
        r.status = ReservationStatus.accepted
        if accept_data.admin_notes:
            r.admin_notes = accept_data.admin_notes

        # Remove old staff assignments if any
        db.query(ReservationStaffAssignment).filter(ReservationStaffAssignment.reservation_id == r.id).delete()

        # Add new staff assignments
        for w_id in (accept_data.waiter_ids or []):
            db.add(ReservationStaffAssignment(
                reservation_id=r.id,
                staff_id=w_id,
                role=StaffRole.waiter
            ))
        
        for c_id in (accept_data.chef_ids or []):
            db.add(ReservationStaffAssignment(
                reservation_id=r.id,
                staff_id=c_id,
                role=StaffRole.chef
            ))

        db.commit()
        db.refresh(r)
        return self._to_response_dto(r)

    def reject_reservation(self, db: Session, reservation_id: int, reject_data: ReservationRejectDTO) -> Dict[str, Any]:
        r = self.repository.get_by_id(db, reservation_id)
        if not r:
            raise ValueError("Reservation not found")
        
        r.status = ReservationStatus.rejected
        if reject_data.admin_notes:
            r.admin_notes = reject_data.admin_notes

        db.commit()
        db.refresh(r)
        return self._to_response_dto(r)

    def cancel_reservation(self, db: Session, reservation_id: int) -> Dict[str, Any]:
        r = self.repository.get_by_id(db, reservation_id)
        if not r:
            raise ValueError("Reservation not found")
        
        r.status = ReservationStatus.cancelled
        db.commit()
        db.refresh(r)
        return self._to_response_dto(r)

    def complete_reservation(self, db: Session, reservation_id: int) -> Dict[str, Any]:
        r = self.repository.get_by_id(db, reservation_id)
        if not r:
            raise ValueError("Reservation not found")
        
        r.status = ReservationStatus.completed
        db.commit()
        db.refresh(r)
        return self._to_response_dto(r)

    def get_pending(self, db: Session) -> List[Dict[str, Any]]:
        reservations = self.repository.find_pending(db)
        return [self._to_response_dto(r) for r in reservations]

    def get_by_customer_id(self, db: Session, customer_id: int) -> List[Dict[str, Any]]:
        reservations = self.repository.find_by_customer_id(db, customer_id)
        return [self._to_response_dto(r) for r in reservations]

    def get_active_by_customer(self, db: Session, customer_id: int) -> Optional[Dict[str, Any]]:
        r = self.repository.find_active_for_customer(db, customer_id)
        if not r:
            return None
        return self._to_response_dto(r)

    def get_by_staff_id(self, db: Session, staff_id: int) -> List[Dict[str, Any]]:
        reservations = self.repository.find_by_staff_id(db, staff_id)
        return [self._to_response_dto(r) for r in reservations]

    def get_weekly_reservations(self, db: Session, start_date_str: Optional[str] = None) -> Dict[str, Any]:
        """
        Get all reservations for a 7-day window starting from start_date (or current week Monday)
        """
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
            except ValueError:
                start_date = datetime.now()
        else:
            now = datetime.now()
            # Start on Monday of current week
            start_date = now - timedelta(days=now.weekday())

        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=7, hours=23, minutes=59, seconds=59)

        reservations = self.repository.find_by_date_range(db, start_date, end_date)

        return {
            "week_start": start_date.strftime("%Y-%m-%d"),
            "week_end": (start_date + timedelta(days=6)).strftime("%Y-%m-%d"),
            "reservations": [self._to_response_dto(r) for r in reservations]
        }

    def get_available_tables_for_slot(
        self, 
        db: Session, 
        reservation_date_str: str, 
        duration_hours: float = 2.0, 
        number_of_guests: int = 1,
        exclude_reservation_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Return all tables with their availability status for the given time slot,
        taking into account capacity and the 1-hour lockout rule.
        """
        try:
            res_date = datetime.fromisoformat(reservation_date_str.replace("Z", "+00:00"))
        except Exception:
            res_date = datetime.strptime(reservation_date_str, "%Y-%m-%d %H:%M:%S")

        all_tables = db.query(Table).order_by(Table.table_number.asc()).all()
        results = []

        for table in all_tables:
            has_conflict = self.repository.find_table_conflicts(
                db, 
                table.id, 
                res_date, 
                duration_hours, 
                exclude_id=exclude_reservation_id
            )
            is_suitable_size = table.table_size >= number_of_guests
            
            results.append({
                "id": table.id,
                "table_number": table.table_number,
                "table_size": table.table_size,
                "floor": table.floor,
                "is_available": not has_conflict,
                "is_suitable_size": is_suitable_size,
                "conflict_reason": "Booked or within 1h buffer" if has_conflict else ("Capacity smaller than guests" if not is_suitable_size else None)
            })

        return results

    def get_deposit_config(self, db: Session) -> float:
        return self.repository.get_deposit_config(db)

    def set_deposit_config(self, db: Session, amount: float) -> float:
        return self.repository.set_deposit_config(db, amount)