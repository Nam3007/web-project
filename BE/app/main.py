from fastapi import FastAPI
from sqlalchemy import text
from db import engine
from controller import customer,staff,menu_item,order_item,order,table,payment,staff_schedule,auth

app = FastAPI(title="Restaurant API")

# include routers
app.include_router(
    customer.router,
    prefix="/customers",
    tags=["Customers"]
)
app.include_router(
    staff.router,
    prefix="/staff",
    tags=["Staff"]
)
app.include_router(
    menu_item.router,
    prefix="/menu-items",
    tags=["Menu Items"]
)

app.include_router(
    order_item.router,
    prefix="/order-items",
    tags=["Order Items"]
)
app.include_router(
    order.router,
    prefix="/orders",
    tags=["Orders"]
)

app.include_router(
    table.router,
    prefix="/tables",
    tags=["Tables"]
)
app.include_router(
    payment.router,
    prefix="/payments",
    tags=["Payments"]
)
app.include_router(
    staff_schedule.router,
    prefix="/staff-schedules",
    tags=["Staff Schedules"]
)

app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)
# startup event
@app.on_event("startup")
def test_db_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")
    except Exception as e:
        print("❌ Database connection failed:", e)
