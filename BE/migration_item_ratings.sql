-- Migration: Add item_ratings table and average_rating column to menu_items
-- Run this against your PostgreSQL database

BEGIN;

-- 1. Create item_ratings table
CREATE TABLE IF NOT EXISTS restaurant.item_ratings
(
    id serial NOT NULL,
    menu_item_id integer NOT NULL,
    order_id integer NOT NULL,
    customer_id integer NOT NULL,
    rating numeric(2, 1) NOT NULL,
    review_text text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT item_ratings_pkey PRIMARY KEY (id),
    CONSTRAINT uq_item_rating_order_item UNIQUE (order_id, menu_item_id)
);

COMMENT ON TABLE restaurant.item_ratings
    IS 'Per-item ratings and reviews from customers';

-- 2. Add foreign keys
ALTER TABLE IF EXISTS restaurant.item_ratings
    ADD CONSTRAINT item_ratings_menu_item_id_fkey FOREIGN KEY (menu_item_id)
    REFERENCES restaurant.menu_items (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS restaurant.item_ratings
    ADD CONSTRAINT item_ratings_order_id_fkey FOREIGN KEY (order_id)
    REFERENCES restaurant.orders (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS restaurant.item_ratings
    ADD CONSTRAINT item_ratings_customer_id_fkey FOREIGN KEY (customer_id)
    REFERENCES restaurant.customers (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;

-- 3. Add indexes
CREATE INDEX IF NOT EXISTS idx_item_ratings_menu_item_id
    ON restaurant.item_ratings(menu_item_id);

CREATE INDEX IF NOT EXISTS idx_item_ratings_order_id
    ON restaurant.item_ratings(order_id);

-- 4. Add average_rating column to menu_items
ALTER TABLE restaurant.menu_items
    ADD COLUMN IF NOT EXISTS average_rating numeric(2, 1) DEFAULT NULL;

END;
