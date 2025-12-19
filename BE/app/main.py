from fastapi import FastAPI
from sqlalchemy import text
from db import engine, Base
from controller import customer,staff,menu_item,order_item,order,table,payment,staff_schedule,auth,vip_request

app = FastAPI(title="Restaurant API")

from fastapi.middleware.cors import CORSMiddleware

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

app.include_router(
    vip_request.router,
    prefix="/vip-requests",
    tags=["VIP Requests"]
)

# startup event
@app.on_event("startup")
def test_db_connection():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")
    except Exception as e:
        print("❌ Database connection failed:", e)
