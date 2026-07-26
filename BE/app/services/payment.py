from sqlalchemy.orm import Session
from models import Payment, PaymentStatus, PaymentMethod
from repository import PaymentRepository
from typing import Any, List, Optional, cast
from schemas import PaymentCreateDTO, PaymentResponse, RevenueSummaryResponse, QuarterRevenueBreakdown
from services import OrderService
from datetime import datetime, date, time, timedelta
import calendar

class PaymentService:
    def __init__(self):
        self.repository = PaymentRepository()
    
    def get_all(self, db: Session, skip: int = 0, limit: int = 100) -> List[Payment]:
        """Get all payments with pagination"""
        return self.repository.get_all(db, skip=skip, limit=limit)
    
    def get_by_id(self, db: Session, payment_id: int) -> Optional[Payment]:
        """Get payment by ID"""
        return self.repository.get_by_id(db, payment_id)
    
    def create(self, db: Session, payment_data: PaymentCreateDTO) -> Payment:
        """Create new payment"""
        OrderServiceInstance = OrderService()
        amount = OrderServiceInstance.get_amounts_paid_by_order_id(db, payment_data.order_id)
        payment = Payment(
            order_id=payment_data.order_id,
            payment_method = payment_data.payment_method,
            amount_paid = amount,
        )
        
        return self.repository.create(db, payment)
    
    
    def delete(self, db: Session, payment_id: int) -> bool:
        """Delete payment"""
        payment = self.repository.get_by_id(db, payment_id)
        if not payment:
            return False
        self.repository.delete(db, payment)
        return True
    
    def get_by_order_id(self, db: Session, order_id: int) -> List[Payment]:
        """Get payments by order ID"""
        return self.repository.find_by_order_id(db, order_id)
    
    def get_by_status(self, db: Session, status: str) -> List[Payment]:
        """Get payments by status"""
        return self.repository.find_by_status(db, status)
    
    def get_by_transaction_id(self, db: Session, transaction_id: str) -> List[Payment]:
        """Get payments by transaction ID"""
        return self.repository.find_by_transaction_id(db, transaction_id)
    
    
    def update_payment_status(self, db: Session, payment_id: int, status: PaymentStatus) -> Optional[Payment]:
        payment = self.repository.update_payment_status(db, payment_id, status)

        if payment and status == PaymentStatus.completed:
            from models import Table, Order, OrderStatus, OrderType
            from services.assignmentService import AssignmentService

            order = db.query(Order).filter(Order.id == payment.order_id).first()
            if order:
                order_model = cast(Any, order)
                if order_model.status in (OrderStatus.pending, OrderStatus.pending.value):
                    # Check if this is a shipping order — needs admin confirmation first
                    if order_model.order_type in (OrderType.shipping, OrderType.shipping.value):
                        order_model.status = OrderStatus.pending_confirmation
                        db.add(order)
                        db.commit()
                        db.refresh(order)
                    else:
                        # Dine-in: normal flow — paid before eating/prep
                        order_model.status = OrderStatus.paid
                        db.add(order)
                        db.commit()
                        db.refresh(order)

                        assignment_svc = AssignmentService()
                        assignment_svc.try_assign_chef(db, order_model)
                        # Safety net: dispatch any remaining queued orders
                        assignment_svc.dispatch_queue(db)
                elif order_model.status in (OrderStatus.served, OrderStatus.served.value,
                                            OrderStatus.delivered, OrderStatus.delivered.value):
                    # Post-pay flow: paid after eating/delivery
                    order_model.status = OrderStatus.completed
                    db.add(order)
                    db.commit()

                # Generate coupon if eligible
                try:
                    from services.coupon_service import CouponService
                    coupon_svc = CouponService()
                    # Calculate total spend based on final_amount or total_amount
                    total_spend = float(order_model.total_amount or 0)
                    if total_spend > 0:
                        coupon_svc.generate_coupon_if_eligible(db, order_model.customer_id, total_spend)
                except Exception as e:
                    # Don't let coupon generation failure break the payment flow
                    print(f"Error generating coupon: {e}")

        return payment
    
    def update_payment_method(self , db: Session , payment_id: int , payment_method: PaymentMethod) -> Optional[Payment]:
        return self.repository.update_payment_method(db, payment_id, payment_method)

    def get_revenue_summary(
        self,
        db: Session,
        period: str = "last_week",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        year: Optional[int] = None,
        quarter: Optional[int] = None,
    ) -> RevenueSummaryResponse:
        period = period.lower()

        if period == "last_week":
            end_dt = datetime.now()
            start_dt = end_dt - timedelta(days=7)
            summary = self.repository.get_revenue_in_range(db, start_dt, end_dt)
            return RevenueSummaryResponse(
                period=period,
                start_date=start_dt,
                end_date=end_dt,
                total_revenue=summary["total_revenue"],
                payments_count=summary["payments_count"],
            )

        if period == "date_range":
            if not start_date or not end_date:
                raise ValueError("start_date and end_date are required for date_range")
            start_dt = datetime.combine(start_date, time.min)
            end_dt = datetime.combine(end_date, time.max)
            summary = self.repository.get_revenue_in_range(db, start_dt, end_dt)
            return RevenueSummaryResponse(
                period=period,
                start_date=start_dt,
                end_date=end_dt,
                total_revenue=summary["total_revenue"],
                payments_count=summary["payments_count"],
            )

        if period == "quarter":
            if year is None or quarter is None:
                raise ValueError("year and quarter are required for quarter reports")
            if quarter < 1 or quarter > 4:
                raise ValueError("quarter must be between 1 and 4")

            start_month = (quarter - 1) * 3 + 1
            end_month = start_month + 2
            start_dt = datetime(year, start_month, 1)
            last_day = calendar.monthrange(year, end_month)[1]
            end_dt = datetime(year, end_month, last_day, 23, 59, 59, 999999)
            summary = self.repository.get_revenue_in_range(db, start_dt, end_dt)
            return RevenueSummaryResponse(
                period=period,
                start_date=start_dt,
                end_date=end_dt,
                total_revenue=summary["total_revenue"],
                payments_count=summary["payments_count"],
                year=year,
                quarter=quarter,
            )

        if period == "year":
            if year is None:
                raise ValueError("year is required for year reports")

            breakdown: list[QuarterRevenueBreakdown] = []
            total_revenue = 0.0
            total_payments = 0
            year_start = datetime(year, 1, 1)
            year_end = datetime(year, 12, 31, 23, 59, 59, 999999)

            for quarter_number in range(1, 5):
                start_month = (quarter_number - 1) * 3 + 1
                end_month = start_month + 2
                quarter_start = datetime(year, start_month, 1)
                quarter_last_day = calendar.monthrange(year, end_month)[1]
                quarter_end = datetime(year, end_month, quarter_last_day, 23, 59, 59, 999999)
                summary = self.repository.get_revenue_in_range(db, quarter_start, quarter_end)
                total_revenue += summary["total_revenue"]
                total_payments += summary["payments_count"]
                breakdown.append(
                    QuarterRevenueBreakdown(
                        quarter=quarter_number,
                        start_date=quarter_start,
                        end_date=quarter_end,
                        total_revenue=summary["total_revenue"],
                        payments_count=summary["payments_count"],
                    )
                )

            return RevenueSummaryResponse(
                period=period,
                start_date=year_start,
                end_date=year_end,
                total_revenue=total_revenue,
                payments_count=total_payments,
                year=year,
                quarterly_breakdown=breakdown,
            )

        raise ValueError("Unsupported period")
    
    