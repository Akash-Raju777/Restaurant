-- V5__address_type_field.sql
-- Add address type field (HOME/WORK/OTHER) to saved addresses

ALTER TABLE addresses ADD COLUMN IF NOT EXISTS address_type VARCHAR(20);

-- Backfill existing addresses with default type 'HOME'
UPDATE addresses
SET address_type = 'HOME'
WHERE address_type IS NULL;
