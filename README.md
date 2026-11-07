# Restaurant Management System

A full-stack restaurant management application with customer ordering, reservations, staff workflows, manager dashboards, payments, menu management, and restaurant operations support.

## Overview

The project is split into two applications:

- **Frontend (`FE/`)** - React 19 application built with Vite, Tailwind CSS, React Router, TanStack Query, Axios, and Recharts.
- **Backend (`BE/`)** - FastAPI application using SQLAlchemy and PostgreSQL. It exposes REST endpoints for authentication, customers, staff, menu items, orders, tables, payments, schedules, reservations, coupons, ratings, and image uploads.

## Features

### Customers

- Browse the restaurant menu
- Add items to a cart and place orders
- View order history and active-order progress
- Reserve tables
- Manage profile information
- Apply coupons and submit item ratings
- Complete QR-based payment flows

### Staff

- View staff dashboard and schedules
- Select tables and create orders for guests
- Track active orders
- Manage reservations
- Support delivery workflows

### Managers

- Monitor restaurant activity from a dashboard
- Manage orders, menu items, tables, customers, staff, and schedules
- Review payments, ratings, coupons, and reservations
- Create staff accounts and confirm orders for shipping/delivery

## Architecture

```text
FE (React + Vite)
        |
        | HTTP/REST
        v
BE (FastAPI)
        |
        v
PostgreSQL (restaurant schema)
```

Architecture, data-flow, order-lifecycle, and order-sequence diagrams are available in [`diagrams/`](diagrams/).

## Project Structure

```text
.
├── BE/
│   ├── app/
│   │   ├── controller/       # FastAPI route handlers
│   │   ├── core/             # Authentication and security helpers
│   │   ├── models/            # SQLAlchemy models
│   │   ├── repository/        # Data-access layer
│   │   ├── schemas/           # Request and response schemas
│   │   ├── services/           # Business logic
│   │   ├── db.py              # Database configuration
│   │   └── main.py             # FastAPI application entry point
│   └── requirements.txt
├── FE/
│   ├── src/
│   │   ├── api/               # API clients
│   │   ├── components/        # Shared UI and layouts
│   │   ├── context/           # Authentication and cart state
│   │   └── pages/             # Customer, staff, manager, and common pages
│   └── package.json
└── diagrams/
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL
- A PostgreSQL database connection string

## Backend Setup

1. Create and activate a virtual environment:

   ```bash
   cd BE
   python -m venv .venv
   source .venv/bin/activate          # Windows: .venv\Scripts\activate
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Configure the database connection. Create `BE/.env` with a `DATABASE_URL` value, for example:

   ```env
   DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@localhost:5432/DATABASE_NAME
   ```

4. Start the API from the application directory:

   ```bash
   cd app
   uvicorn main:app --reload
   ```

The API is available at `http://localhost:8000`. Interactive API documentation is available at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

On startup, the backend creates missing SQLAlchemy tables and serves uploaded images from `/images`.

## Frontend Setup

```bash
cd FE
npm install
npm run dev
```

The Vite development server normally runs at `http://localhost:5173`.

Available frontend commands:

```bash
npm run dev       # Start the development server
npm run build     # Create a production build
npm run lint      # Run ESLint
npm run preview   # Preview the production build
```

## Main Routes

| Area | Routes |
| --- | --- |
| Common | `/login`, `/register` |
| Customer | `/menu`, `/cart`, `/orders`, `/active-orders`, `/reservations`, `/tables`, `/profile`, `/qr-payment` |
| Staff | `/staff/dashboard`, `/staff/tables`, `/staff/orders`, `/staff/orders/new`, `/staff/reservations`, `/staff/schedule`, `/staff/delivery` |
| Manager | `/manager/dashboard`, `/manager/orders`, `/manager/menu`, `/manager/staff`, `/manager/tables`, `/manager/payments`, `/manager/customers`, `/manager/schedule`, `/manager/reviews`, `/manager/coupons`, `/manager/reservations` |

## Backend API Areas

The FastAPI application registers routes for:

`/auth`, `/customers`, `/staff`, `/menu-items`, `/order-items`, `/orders`, `/tables`, `/payments`, `/staff-schedules`, `/upload`, `/item-ratings`, `/coupons`, and `/reservations`.

Use the generated Swagger documentation at `/docs` for request and response details.

## Diagrams

The repository includes both editable JSON diagram definitions and HTML exports:

- Restaurant system architecture
- Restaurant system data flow
- Restaurant order lifecycle
- Restaurant order sequence

## License

No license has been specified for this repository.
