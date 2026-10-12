import os
import re
from decimal import Decimal, InvalidOperation
from secrets import compare_digest
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Response, status, Query
from sqlalchemy.orm import Session
from datetime import date
from db import get_db
from models import Payment, PaymentStatus, PaymentMethod, RestaurantConfig
from schemas import PaymentCreateDTO, PaymentResponse, RevenueSummaryResponse, PaymentVerificationResponse, VietQRConfig
from services import PaymentService


router = APIRouter()
# Initialize service
payment_service = PaymentService()

VIETQR_BANK_ID = os.getenv("VIETQR_BANK_ID", "970403")
VIETQR_ACCOUNT_NO = os.getenv("VIETQR_ACCOUNT_NO", "060252287577")
VIETQR_ACCOUNT_NAME = os.getenv("VIETQR_ACCOUNT_NAME", "TRAN QUOC NAM")
SEPAY_WEBHOOK_API_KEY = os.getenv("SEPAY_WEBHOOK_API_KEY") or os.getenv("SEPAY_API_KEY", "")
VIETQR_CONFIG_KEYS = {
    "bank_id": "vietqr_bank_id",
    "account_no": "vietqr_account_no",
    "account_name": "vietqr_account_name",
}


def get_vietqr_config(db: Session) -> dict[str, str]:
    defaults = {
        "bank_id": VIETQR_BANK_ID,
        "account_no": VIETQR_ACCOUNT_NO,
        "account_name": VIETQR_ACCOUNT_NAME,
    }
    rows = db.query(RestaurantConfig).filter(
        RestaurantConfig.config_key.in_(VIETQR_CONFIG_KEYS.values())
    ).all()
    values = {
        field: row.config_value
        for row in rows
        for field, config_key in VIETQR_CONFIG_KEYS.items()
        if row.config_key == config_key
    }
    return {field: values.get(field, default) for field, default in defaults.items()}


def _sepay_value(payload: dict, *keys: str):
    for key in keys:
        if payload.get(key) is not None:
            return payload[key]
    return None


def _sepay_authorized(authorization: str | None) -> bool:
    if not SEPAY_WEBHOOK_API_KEY or not authorization:
        return False
    scheme, _, token = authorization.partition(" ")
    return scheme.lower() in {"apikey", "bearer"} and compare_digest(token, SEPAY_WEBHOOK_API_KEY)

@router.get("/summary", response_model=RevenueSummaryResponse)
async def get_revenue_summary(
    period: str = Query("last_week", pattern="^(last_week|date_range|quarter|year)$"),
    start_date: date | None = None,
    end_date: date | None = None,
    year: int | None = None,
    quarter: int | None = Query(None, ge=1, le=4),
    db: Session = Depends(get_db)
):
    """Get revenue summary for a period"""
    try:
        return payment_service.get_revenue_summary(
            db,
            period=period,
            start_date=start_date,
            end_date=end_date,
            year=year,
            quarter=quarter,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=list[PaymentResponse])
async def get_all_payments(
    skip:int = 0,
    limit:int = 100,
    db: Session = Depends(get_db)

):
    """Get all payments"""
    payments = payment_service.get_all(db, skip=skip, limit=limit)
    return payments

@router.get("/config", response_model=VietQRConfig)
async def get_payment_config(db: Session = Depends(get_db)):
    return get_vietqr_config(db)

@router.put("/config", response_model=VietQRConfig)
async def update_payment_config(config: VietQRConfig, db: Session = Depends(get_db)):
    values = config.model_dump()
    if not values["bank_id"].isdigit() or len(values["bank_id"]) != 6:
        raise HTTPException(status_code=400, detail="bank_id must be a 6-digit numeric BIN")
    if not values["account_no"].isdigit() or not 4 <= len(values["account_no"]) <= 20:
        raise HTTPException(status_code=400, detail="account_no must contain 4-20 digits")
    if not values["account_name"].strip():
        raise HTTPException(status_code=400, detail="account_name is required")

    for field, value in values.items():
        key = VIETQR_CONFIG_KEYS[field]
        row = db.query(RestaurantConfig).filter(RestaurantConfig.config_key == key).first()
        if row:
            row.config_value = value.strip()
        else:
            db.add(RestaurantConfig(config_key=key, config_value=value.strip(), description=f"VietQR {field}"))
    db.commit()
    return get_vietqr_config(db)

@router.post("/sepay/webhook")
async def receive_sepay_webhook(
    payload: dict,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """Validate an incoming SePay transfer and complete its matching payment."""
    if not _sepay_authorized(authorization):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook credentials")

    transaction_id = str(_sepay_value(payload, "id", "referenceCode") or "").strip()
    transfer_type = str(_sepay_value(payload, "transferType", "type") or "").lower()
    account_number = str(_sepay_value(payload, "accountNumber", "account") or "").strip()
    transfer_amount = _sepay_value(payload, "transferAmount", "amount")
    content = str(_sepay_value(payload, "content", "transactionContent", "description") or "")
    if not transaction_id or transfer_type not in {"in", "credit"}:
        raise HTTPException(status_code=400, detail="Invalid incoming transaction payload")

    config = get_vietqr_config(db)
    if account_number != config["account_no"]:
        raise HTTPException(status_code=400, detail="Transaction account does not match configured account")
    try:
        incoming_amount = Decimal(str(transfer_amount))
    except (InvalidOperation, TypeError):
        raise HTTPException(status_code=400, detail="Invalid transfer amount")

    existing = payment_service.get_by_transaction_id(db, transaction_id)
    if existing:
        if any(payment.payment_status == PaymentStatus.completed for payment in existing):
            return {"accepted": True, "duplicate": True, "payment_status": "completed"}
        raise HTTPException(status_code=409, detail="Transaction ID is already assigned")

    order_match = re.search(r"\bDH\s*(\d+)\b", content, flags=re.IGNORECASE)
    if not order_match:
        raise HTTPException(status_code=400, detail="Transfer reference must contain DH {order_id}")

    payment = db.query(Payment).filter(
        Payment.payment_method == PaymentMethod.QR,
        Payment.payment_status == PaymentStatus.pending,
        Payment.order_id == int(order_match.group(1)),
    ).with_for_update(skip_locked=True).first()
    if not payment:
        raise HTTPException(status_code=404, detail="No matching pending QR payment found")
    if incoming_amount != Decimal(str(payment.amount_paid)):
        raise HTTPException(status_code=400, detail="Transfer amount does not match payment amount")

    payment_service.complete_sepay_payment(db, payment, transaction_id)
    return {"accepted": True, "duplicate": False, "payment_id": payment.id, "payment_status": "completed"}

@router.get("/{payment_id}/qr", response_class=Response)
async def get_payment_qr(payment_id: int, db: Session = Depends(get_db)):
    """Generate and serve the VietQR image for a QR payment."""
    payment = payment_service.get_by_id(db, payment_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    if payment.payment_method != PaymentMethod.QR:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment is not a QR payment")
    if not payment.order_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment has no order")

    config = get_vietqr_config(db)
    query = urlencode({
        "amount": round(float(payment.amount_paid)),
        "addInfo": f"DH {payment.order_id}",
        "accountName": config["account_name"],
    })
    qr_url = (
        f"https://img.vietqr.io/image/{config['bank_id']}-{config['account_no']}-compact2.png?{query}"
    )

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            upstream = await client.get(qr_url)
            upstream.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to generate payment QR code",
        ) from exc

    return Response(
        content=upstream.content,
        media_type=upstream.headers.get("content-type", "image/png"),
        headers={"Cache-Control": "no-store"},
    )

@router.get("/{payment_id}/verify", response_model=PaymentVerificationResponse)
async def verify_payment(payment_id: int, db: Session = Depends(get_db)):
    """Return the payment state recorded by the application."""
    payment = payment_service.get_by_id(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {
        "payment_id": payment.id,
        "payment_status": payment.payment_status,
        "completed": payment.payment_status == PaymentStatus.completed,
        "transaction_id": payment.transaction_id,
    }

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id : int , db: Session = Depends(get_db)):
    """Get payment by ID"""
    payment = payment_service.get_by_id(db, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    return payment

@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_data: PaymentCreateDTO,
    db: Session = Depends(get_db)
):
    """Create new payment"""
    try:
        return payment_service.create(db, payment_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.patch("/{payment_id}/status", response_model=PaymentResponse)
async def update_payment_status(
    payment_id: int,
    payment_status: PaymentStatus,
    db: Session = Depends(get_db)
):
    """Update payment status"""
    payment = payment_service.update_payment_status(db, payment_id,payment_status)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    return payment

@router.patch("/{payment_id}/method", response_model=PaymentResponse)
async def update_payment_method(
    payment_id: int,
    payment_method: PaymentMethod,
    db: Session = Depends(get_db)
):
    """Update payment method"""
    payment = payment_service.update_payment_method(db, payment_id, payment_method)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    return payment

@router.get("/order/{order_id}", response_model=list[PaymentResponse])
async def get_payments_by_order_id(
    order_id: int,
    db: Session = Depends(get_db)
):
    """Get payments by order ID"""
    payments = payment_service.get_by_order_id(db, order_id)
    return payments