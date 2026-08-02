from schemas import OrderCreateDTO, OrderUpdateDTO
from sqlalchemy.orm import Session
from models import Order, OrderStatus, OrderType
from typing import List
from repository import OrderRepository,OrderItemRepository, PaymentRepository, TableRepository

class OrderService:
    def __init__(self):
        self.repository = OrderRepository()
        self.order_item_repository = OrderItemRepository()
        self.payment_repository = PaymentRepository()
        self.table_repository = TableRepository()
    
    def recalculate_order_total(self, db: Session, order_id: int):
        total = self.repository.calculate_total_amount(db, order_id)

        order = self.repository.get_by_id(db, order_id)
        order.total_amount = total
        order.final_amount = total - order.discount_amount

        self.repository.update(db, order)
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Order]:
        return self.repository.get_all(db, skip, limit)
    
    def get_by_id(self, db: Session, order_id: int) -> Order:
        return self.repository.get_by_id(db, order_id)
    
    def create(self, db: Session, order_data: OrderCreateDTO) -> Order:
        order = Order(
            customer_id=order_data.customer_id,
            table_id=order_data.table_id,
            staff_id=order_data.staff_id,
            notes=order_data.notes,
            order_type=order_data.order_type,
            shipping_address=order_data.shipping_address
        )
        created_order = self.repository.create(db, order)

        if order_data.order_type in (OrderType.dine_in, "dine_in") and order_data.table_id is not None:
            # Mark the table as occupied
            self.table_repository.update_table_status(db, order_data.table_id, is_occupied=True)

        return created_order
    
    def update(self, db: Session, order_id: int, order_data: OrderUpdateDTO) -> Order:
        order = self.get_by_id(db, order_id)

        previous_status = order.status
        for key, value in order_data.model_dump(exclude_unset=True).items():
            setattr(order, key, value)

        new_status = order.status

        # Persist base changes first
        updated_order = self.repository.update(db, order)

        # ----- Side-effects based on status transitions -----
        from services.assignmentService import AssignmentService
        assignment_svc = AssignmentService()

        if new_status == "ready" and previous_status != "ready":
            # Chef marked order ready: free the chef, then assign waiter/delivery_man
            if updated_order.staff_id:
                assignment_svc.free_staff_and_dispatch(db, updated_order.staff_id)
            assignment_svc.try_assign_next_staff(db, updated_order)
            db.refresh(updated_order)

        elif new_status in ("served", "delivered", "completed") and previous_status not in ("served", "delivered", "completed"):
            # Waiter/delivery_man finished: free them and dispatch queue
            if updated_order.staff_id:
                assignment_svc.free_staff_and_dispatch(db, updated_order.staff_id)

            if new_status == "completed" and updated_order.table_id:
                self.table_repository.update_table_status(db, updated_order.table_id, is_occupied=False)


        return updated_order

    
    def delete(self, db: Session, order_id: int) -> bool:
        order = self.get_by_id(db, order_id)
        if not order:
            return False
        self.payment_repository.delete_by_order_id(db, order_id)
        self.repository.delete(db, order)
        return True
    
    def find_by_customer_id(self, db: Session, customer_id: int) -> List[Order]:
        return self.repository.find_by_customer_id(db, customer_id)
    
    def get_amounts_paid_by_order_id(self, db: Session , order_id: int) ->float:
        order = self.repository.get_by_id(db, order_id)
        if not order:
            return 0.0
        # Include 8% tax to match frontend calculation
        return float(order.final_amount) * 1.08
    
    def find_by_status(self, db: Session, status: OrderStatus) -> List[Order]:
        return self.repository.find_by_status(db, status)

    def find_shipping_active(self, db: Session) -> List[Order]:
        """Returns ready/delivering shipping orders for the Delivery Man dashboard."""
        return self.repository.find_shipping_orders_active(db)

    def find_shipping_by_customer(self, db: Session, customer_id: int) -> List[Order]:
        """Returns a customer's active shipping orders (delivering/delivered/paid)."""
        return self.repository.find_shipping_by_customer(db, customer_id)

    def find_by_status_and_type(self, db: Session, status: OrderStatus, order_type: OrderType) -> List[Order]:
        return self.repository.find_by_status_and_type(db, status, order_type)

    def find_active_by_customer(self, db: Session, customer_id: int) -> List[Order]:
        """Returns all active (non-completed, non-cancelled) orders for a customer."""
        return self.repository.find_active_by_customer(db, customer_id)

    def find_pending_confirmation_shipping(self, db: Session) -> List[Order]:
        """Returns all shipping orders awaiting admin confirmation."""
        return self.repository.find_pending_confirmation_shipping(db)

    def find_todays_shipping_orders(self, db: Session) -> List[Order]:
        """Returns all shipping orders created today."""
        return self.repository.find_todays_shipping_orders(db)

    def confirm_shipping_order(self, db: Session, order_id: int) -> Order:
        """Admin confirms a shipping order — enters the chef assignment pipeline."""
        order = self.get_by_id(db, order_id)
        if not order:
            return None
        if order.status != OrderStatus.pending_confirmation:
            raise ValueError("Order is not in pending_confirmation status")
        if order.order_type != OrderType.shipping:
            raise ValueError("Only shipping orders can be confirmed via this endpoint")

        # Mark as confirmed first so progress bar advances past "Confirming"
        order.status = OrderStatus.confirmed
        db.add(order)
        db.commit()
        db.refresh(order)

        from services.assignmentService import AssignmentService
        assignment_svc = AssignmentService()
        order = assignment_svc.try_assign_chef(db, order)
        assignment_svc.dispatch_queue(db)
        return order