-- V3__offer_management.sql
-- Product-aware offers, usage limits, free items and historical order snapshots.

ALTER TABLE offers ADD COLUMN IF NOT EXISTS usage_limit INTEGER;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS per_user_limit INTEGER;
ALTER TABLE offers ADD COLUMN IF NOT EXISTS times_used INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS offer_items (
    id BIGSERIAL PRIMARY KEY,
    offer_id BIGINT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    menu_item_id BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    is_free BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uk_offer_items_offer_menu UNIQUE (offer_id, menu_item_id)
);

CREATE INDEX IF NOT EXISTS idx_offer_items_offer_id ON offer_items(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_items_menu_item_id ON offer_items(menu_item_id);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS applied_offer_id BIGINT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS applied_offer_title VARCHAR(200);

CREATE INDEX IF NOT EXISTS idx_orders_applied_offer ON orders(applied_offer_id);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_free_item BOOLEAN NOT NULL DEFAULT FALSE;
