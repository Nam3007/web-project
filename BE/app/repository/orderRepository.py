from typing import List
from sqlalchemy.orm import Session
from models import Order, OrderStatus, OrderType
from sqlalchemy.sql import func
from models import OrderItem

class OrderRepository:
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Order]:
        return db.query(Order).offset(skip).limit(limit).all()

    def get_by_id(self, db: Session, order_id: int) -> Order:
        return db.query(Order).filter(Order.id == order_id).first()

    def create(self, db: Session, order: Order) -> Order:
        db.add(order)
        db.commit()
        db.refresh(order)
        return order

    def update(self, db: Session, order: Order) -> Order:
        db.merge(order)
        db.commit()
        db.refresh(order)
        return order

    def delete(self, db: Session, order: Order) -> None:
        db.delete(order)
        db.commit()
    
    def find_by_customer_id(self, db: Session, customer_id: int) -> List[Order]:
        return db.query(Order).filter(Order.customer_id == customer_id).all()
    
    def find_by_status(self, db: Session, status: OrderStatus) -> List[Order]:
        return db.query(Order).filter(Order.status == status, Order.order_type == OrderType.dine_in).all()
    
    def calculate_total_amount(self, db: Session, order_id: int):
        total = (
            db.query(func.coalesce(func.sum(OrderItem.subtotal), 0))
            .filter(OrderItem.order_id == order_id)
            .scalar()
        )
        return total

    def find_shipping_orders_active(self, db: Session) -> List[Order]:
        """Returns shipping orders with status ready or delivering — for delivery man dashboard."""
        return (
            db.query(Order)
            .filter(
                Order.order_type == OrderType.shipping,
                Order.status.in_([OrderStatus.ready, OrderStatus.delivering])
            )
            .order_by(Order.created_at.asc())
            .all()
        )

    def find_shipping_by_customer(self, db: Session, customer_id: int) -> List[Order]:
        """Returns a customer's shipping orders with status delivering or delivered."""
        return (
            db.query(Order)
            .filter(
                Order.customer_id == customer_id,
                Order.order_type == OrderType.shipping,
                Order.status.in_([OrderStatus.delivering, OrderStatus.delivered, OrderStatus.paid])
            )
            .order_by(Order.created_at.desc())
            .all()
        )
    
    def find_by_status_and_type(self, db: Session, status: OrderStatus, order_type: OrderType) -> List[Order]:
        return db.query(Order).filter(Order.status == status, Order.order_type == order_type).all()

    def find_by_staff_id(self, db: Session, staff_id: int) -> List[Order]:
        """Return all active orders assigned to a specific staff member."""
        return (
            db.query(Order)
            .filter(
                Order.staff_id == staff_id,
                Order.status.notin_(["completed", "cancelled", "delivered"])
            )
            .order_by(Order.created_at.asc())
            .all()
        )

    def find_active_by_customer(self, db: Session, customer_id: int) -> List[Order]:
        """Returns all active orders + recently completed (within 24h) for rating."""
        from sqlalchemy import or_, and_
        from datetime import datetime, timedelta
        cutoff = datetime.now() - timedelta(hours=24)
        return (
            db.query(Order)
            .filter(
                Order.customer_id == customer_id,
                or_(
                    # Active orders (not completed, not cancelled)
                    Order.status.notin_([
                        OrderStatus.completed,
                        OrderStatus.cancelled,
                    ]),
                    # Recently completed orders (for rating)
                    and_(
                        Order.status == OrderStatus.completed,
                        Order.updated_at >= cutoff,
                    )
                )
            )
            .order_by(Order.created_at.desc())
            .all()
        )

    def find_pending_confirmation_shipping(self, db: Session) -> List[Order]:
        """Returns all shipping orders awaiting admin confirmation."""
        return (
            db.query(Order)
            .filter(
                Order.order_type == OrderType.shipping,
                Order.status == OrderStatus.pending_confirmation,
            )
            .order_by(Order.created_at.asc())
            .all()
        )

    def find_todays_shipping_orders(self, db: Session) -> List[Order]:
        """Returns all shipping orders created today (for admin daily view)."""
        from datetime import datetime, time
        today_start = datetime.combine(datetime.now().date(), time.min)
        return (
            db.query(Order)
            .filter(
                Order.order_type == OrderType.shipping,
                Order.created_at >= today_start,
            )
            .order_by(Order.created_at.desc())
            .all()
        )