-- V2__seed_ember_data.sql
-- Seed Initial Data for The Ember Restaurant Platform

-- Categories matching the reference UI
INSERT INTO categories (name, slug, display_order, is_active) VALUES
('Starters', 'starters', 1, true),
('Main Course', 'main-course', 2, true),
('Biryani & Rice', 'biryani', 3, true),
('Desserts', 'desserts', 4, true),
('Beverages', 'beverages', 5, true)
ON CONFLICT (slug) DO NOTHING;

-- Initial System User Accounts
-- Password hashes are managed and verified via DataInitializer using secure environment variables.
INSERT INTO users (full_name, email, password_hash, phone_number, role, is_active) VALUES
('Master Chef Arjun / Administrator', 'admin@theember.com', '$2a$10$e84W355vFjDkQo3aUvO8p.5B3wS7UqL8UaV1P5Z9R6F2O4M0N7K2C', '+91 98765 43210', 'ROLE_ADMIN', true),
('Rohan Sharma', 'customer@theember.com', '$2a$10$e84W355vFjDkQo3aUvO8p.5B3wS7UqL8UaV1P5Z9R6F2O4M0N7K2C', '+91 91234 56789', 'ROLE_CUSTOMER', true)
ON CONFLICT (email) DO NOTHING;

-- Sample Address for demo customer
INSERT INTO addresses (user_id, house_details, street, area, city, state, postal_code, delivery_instructions, is_default)
SELECT id, 'Flat 402, Royal Palms Residency', 'MG Road, Indiranagar', 'Indiranagar', 'Bengaluru', 'Karnataka', '560038', 'Leave with security guard if not available', true
FROM users WHERE email = 'customer@theember.com'
LIMIT 1;

-- Menu Items strictly matching the reference image layout and titles
INSERT INTO menu_items (category_id, name, slug, description, price, discounted_price, is_veg, is_available, is_featured, image_url, ingredients, allergen_info, spice_levels, rating, review_count)
VALUES
(
    (SELECT id FROM categories WHERE slug = 'starters'),
    'Paneer Tikka',
    'paneer-tikka',
    'Char-grilled cottage cheese cubes marinated in Kashmiri red chili, mustard oil, yogurt, and hand-ground spices.',
    249.00,
    NULL,
    true,
    true,
    true,
    '/images/food/paneer-tikka.png',
    'Cottage Cheese, Kashmiri Chili, Yogurt, Mustard Oil, Garam Masala, Bell Peppers, Onions',
    'Contains Dairy (Milk / Yogurt)',
    'Mild,Medium,Spicy',
    4.8,
    420
),
(
    (SELECT id FROM categories WHERE slug = 'main-course'),
    'Butter Chicken',
    'butter-chicken',
    'Tender chicken pieces cooked in a rich and velvety tomato sauce with aromatic spices, churned white butter, and fenugreek leaves.',
    349.00,
    NULL,
    false,
    true,
    true,
    '/images/food/butter-chicken.png',
    'Chicken, Vine-ripened Tomatoes, Cashews, Butter, Heavy Cream, Kasoori Methi, Cardamom',
    'Contains Dairy, Nuts (Cashews)',
    'Mild,Medium',
    4.9,
    1280
),
(
    (SELECT id FROM categories WHERE slug = 'biryani'),
    'Veg Biryani',
    'veg-biryani',
    'Fragrant aged Basmati rice layered with garden-fresh vegetables, saffron milk, caramelized shallots, and slow-dum-cooked.',
    299.00,
    NULL,
    true,
    true,
    true,
    '/images/food/veg-biryani.png',
    'Aged Basmati Rice, French Beans, Carrots, Green Peas, Saffron, Ghee, Mint, Rose Water',
    'Contains Dairy (Ghee)',
    'Mild,Medium,Spicy',
    4.7,
    350
),
(
    (SELECT id FROM categories WHERE slug = 'biryani'),
    'Chicken Biryani',
    'chicken-biryani',
    'Royal Nizami style aromatic dum biryani with succulent bone-in chicken steeped in saffron broth and crushed whole spices.',
    349.00,
    NULL,
    false,
    true,
    true,
    '/images/food/chicken-biryani.png',
    'Long Grain Basmati Rice, Marinated Chicken, Saffron, Caramelized Onions, Fresh Mint, Coriander, Shahi Zeera',
    'Contains Dairy (Ghee, Yogurt)',
    'Medium,Spicy',
    4.9,
    1890
),
(
    (SELECT id FROM categories WHERE slug = 'desserts'),
    'Chocolate Lava Cake',
    'chocolate-lava-cake',
    'Warm Belgian dark chocolate cake with a molten truffle center, dusted with gold cocoa and served with vanilla bean whip.',
    199.00,
    NULL,
    true,
    true,
    true,
    '/images/food/chocolate-lava-cake.png',
    'Belgian Dark Chocolate (70%), Brown Butter, Pure Cane Sugar, Cocoa Dust, Madagascan Vanilla',
    'Contains Dairy, Gluten',
    'Not Applicable',
    4.8,
    510
),
(
    (SELECT id FROM categories WHERE slug = 'beverages'),
    'Mojito',
    'mojito',
    'Refreshing crushed fresh garden mint muddled with Persian lime juice, raw cane sugar syrup, and fizzy sparkling mineral soda.',
    149.00,
    NULL,
    true,
    true,
    true,
    '/images/food/mojito.png',
    'Fresh Mint Leaves, Persian Lime, Raw Cane Sugar, Sparkling Mineral Soda, Crushed Mountain Ice',
    'None',
    'Not Applicable',
    4.6,
    290
),
(
    (SELECT id FROM categories WHERE slug = 'starters'),
    'Chicken Tikka',
    'chicken-tikka',
    'Boneless chicken cubes steeped in tandoori spices and mustard glaze, char-roasted over glowing coal embers.',
    299.00,
    NULL,
    false,
    true,
    false,
    '/images/food/chicken-tikka.png',
    'Boneless Chicken, Ginger Garlic Paste, Hung Curd, Degi Mirch, Chaat Masala',
    'Contains Dairy (Curd)',
    'Medium,Spicy',
    4.8,
    640
),
(
    (SELECT id FROM categories WHERE slug = 'main-course'),
    'Paneer Butter Masala',
    'paneer-butter-masala',
    'Silken soft malai paneer cubes simmered in a mildly spiced, sweet and creamy tomato-cashew gravy.',
    279.00,
    NULL,
    true,
    true,
    false,
    '/images/food/paneer-butter-masala.png',
    'Malai Paneer, Ripe Plum Tomatoes, Cashew Paste, Makkhan, Kasuri Methi, Honey',
    'Contains Dairy, Nuts',
    'Mild,Medium',
    4.7,
    810
),
(
    (SELECT id FROM categories WHERE slug = 'main-course'),
    'Mutton Rogan Josh',
    'mutton-rogan-josh',
    'Kashmiri delicacy of tender braised goat meat infused with cloves, bay leaf, cinnamon, and rattan jot infusion.',
    399.00,
    NULL,
    false,
    true,
    false,
    '/images/food/mutton-rogan-josh.png',
    'Prime Goat Cutlets, Kashmiri Fennel, Dry Ginger, Asafoetida, Mustard Oil, Rattan Jot',
    'None',
    'Medium,Spicy',
    4.9,
    720
),
(
    (SELECT id FROM categories WHERE slug = 'main-course'),
    'Garlic Naan',
    'garlic-naan',
    'Traditional leavened clay oven bread brushed generously with crushed charred garlic butter and fresh coriander.',
    79.00,
    NULL,
    true,
    true,
    false,
    '/images/food/garlic-naan.png',
    'Refined Flour, Charred Garlic, Salted Butter, Fresh Cilantro, Kalonji Seeds',
    'Contains Gluten, Dairy',
    'Mild',
    4.7,
    950
);

-- Offers matching reference image exactly
INSERT INTO offers (title, description, code, discount_type, discount_value, min_order_amount, max_discount_amount, combo_items, banner_image_url, start_date, expiry_date, is_active)
VALUES
(
    'Weekend Special',
    'Enjoy 20% OFF on all signature Main Courses every Friday to Sunday evening.',
    'WEEKEND20',
    'PERCENTAGE',
    20.00,
    499.00,
    200.00,
    'All Main Courses eligible',
    '/images/offers/weekend-special.png',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP + INTERVAL '90 days',
    true
),
(
    'Family Combo',
    'Complete royal feast for 4 guests: 2 Dum Biryanis, 1 Butter Chicken or Paneer Butter Masala, 4 Butter Naans & 4 Desserts.',
    'FAMILY999',
    'FIXED_AMOUNT',
    300.00,
    1299.00,
    300.00,
    '2 Biryani + 1 Curries + 4 Naan + 4 Desserts',
    '/images/offers/family-combo.png',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP + INTERVAL '120 days',
    true
),
(
    'Lunch Combo',
    'Crisp power lunch: 1 Tandoori Starter + 1 Gourmet Curry + 2 Tandoori Rotis + 1 Artisanal Beverage.',
    'LUNCH499',
    'FIXED_AMOUNT',
    150.00,
    649.00,
    150.00,
    '1 Starter + 1 Curry + 2 Breads + 1 Beverage',
    '/images/offers/lunch-combo.png',
    CURRENT_TIMESTAMP - INTERVAL '10 days',
    CURRENT_TIMESTAMP + INTERVAL '180 days',
    true
);

-- Seed Initial Orders for demo customer matching reference image "My Orders"
-- #ORD12345: Butter Chicken + Naan, Total 428, Preparing
-- #ORD12344: Paneer Tikka + Biryani, Total 576, Delivered
-- #ORD12343: Veg Pizza / Dish + Cold Coffee, Total 349, Completed
INSERT INTO orders (order_number, user_id, customer_name, customer_phone, delivery_address, subtotal, discount_amount, delivery_fee, total_amount, payment_method, payment_status, order_status, delivery_notes, created_at)
SELECT
    'ORD12345',
    u.id,
    u.full_name,
    u.phone_number,
    '{"house": "Flat 402, Royal Palms", "street": "MG Road", "area": "Indiranagar", "city": "Bengaluru", "state": "Karnataka", "pincode": "560038"}'::jsonb,
    428.00,
    0.00,
    0.00,
    428.00,
    'COD',
    'PENDING',
    'PREPARING',
    'Please ring the doorbell twice',
    CURRENT_TIMESTAMP - INTERVAL '45 minutes'
FROM users u WHERE email = 'customer@theember.com'
LIMIT 1;

INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal, customization_notes)
SELECT o.id, m.id, m.name, 349.00, 1, 349.00, 'Medium spice'
FROM orders o, menu_items m
WHERE o.order_number = 'ORD12345' AND m.slug = 'butter-chicken'
LIMIT 1;

INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal, customization_notes)
SELECT o.id, m.id, m.name, 79.00, 1, 79.00, 'Extra butter'
FROM orders o, menu_items m
WHERE o.order_number = 'ORD12345' AND m.slug = 'garlic-naan'
LIMIT 1;

-- Order 2: Delivered
INSERT INTO orders (order_number, user_id, customer_name, customer_phone, delivery_address, subtotal, discount_amount, delivery_fee, total_amount, payment_method, payment_status, order_status, delivery_notes, created_at)
SELECT
    'ORD12344',
    u.id,
    u.full_name,
    u.phone_number,
    '{"house": "Flat 402, Royal Palms", "street": "MG Road", "area": "Indiranagar", "city": "Bengaluru", "state": "Karnataka", "pincode": "560038"}'::jsonb,
    576.00,
    0.00,
    0.00,
    576.00,
    'ONLINE_UPI',
    'PAID',
    'DELIVERED',
    'Leave at doorstep',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM users u WHERE email = 'customer@theember.com'
LIMIT 1;

INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal, customization_notes)
SELECT o.id, m.id, m.name, 249.00, 1, 249.00, 'Mild'
FROM orders o, menu_items m
WHERE o.order_number = 'ORD12344' AND m.slug = 'paneer-tikka'
LIMIT 1;

INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal, customization_notes)
SELECT o.id, m.id, m.name, 299.00, 1, 299.00, 'Extra raita'
FROM orders o, menu_items m
WHERE o.order_number = 'ORD12344' AND m.slug = 'veg-biryani'
LIMIT 1;
