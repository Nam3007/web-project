-- ============================================================
-- Migration: Login Status Gate + Order Auto-Assignment Queue
-- Run this script once against your PostgreSQL database.
-- ============================================================

BEGIN;

-- ----------------------------------------------------------
-- 1. Add customer_status enum + status column to customers
-- ----------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE restaurant.customer_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'customer_status already exists, skipping.';
END $$;

ALTER TABLE restaurant.customers
    ADD COLUMN IF NOT EXISTS status restaurant.customer_status NOT NULL DEFAULT 'active';


-- ----------------------------------------------------------
-- 2. Ensure staff_status and staff_availability enums exist
--    (Python model already defines them; ensure DB is in sync)
-- ----------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE restaurant.staff_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'staff_status already exists, skipping.';
END $$;

DO $$ BEGIN
    CREATE TYPE restaurant.staff_availability AS ENUM ('available', 'unavailable');
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'staff_availability already exists, skipping.';
END $$;

ALTER TABLE restaurant.staff
    ADD COLUMN IF NOT EXISTS status restaurant.staff_status NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS availability restaurant.staff_availability NOT NULL DEFAULT 'available';


-- ----------------------------------------------------------
-- 3. Add 'queued' value to order_status enum
-- ----------------------------------------------------------
ALTER TYPE restaurant.order_status ADD VALUE IF NOT EXISTS 'queued';


-- ----------------------------------------------------------
-- 4. Add completion_requested column to orders
-- ----------------------------------------------------------
ALTER TABLE restaurant.orders
    ADD COLUMN IF NOT EXISTS completion_requested BOOLEAN NOT NULL DEFAULT FALSE;


-- ----------------------------------------------------------
-- 5. Create order_queue table
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurant.order_queue (
    id                SERIAL PRIMARY KEY,
    order_id          INTEGER NOT NULL
                        REFERENCES restaurant.orders(id) ON DELETE CASCADE,
    required_role     VARCHAR(20) NOT NULL,   -- 'chef' | 'waiter' | 'delivery_man'
    queued_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dispatched_at     TIMESTAMP,              -- NULL = still waiting in queue
    assigned_staff_id INTEGER
                        REFERENCES restaurant.staff(id) ON DELETE SET NULL,
    CONSTRAINT order_queue_order_id_unique UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_order_queue_pending
    ON restaurant.order_queue(dispatched_at)
    WHERE dispatched_at IS NULL;

COMMENT ON TABLE restaurant.order_queue IS
    'Holds orders waiting to be assigned to an available staff member.';

COMMIT;
