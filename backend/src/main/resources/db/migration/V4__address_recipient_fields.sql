-- V4__address_recipient_fields.sql
-- Add recipient name and phone to saved addresses for checkout cards

ALTER TABLE addresses ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(150);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(30);

-- Backfill existing addresses with the associated user's name and phone
UPDATE addresses a
SET recipient_name = u.full_name
FROM users u
WHERE a.user_id = u.id
  AND a.recipient_name IS NULL;

UPDATE addresses a
SET recipient_phone = u.phone_number
FROM users u
WHERE a.user_id = u.id
  AND a.recipient_phone IS NULL;
