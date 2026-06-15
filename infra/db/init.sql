-- Products & menus (product-service)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    category VARCHAR(50) NOT NULL,
    available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menus (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_items (
    menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (menu_id, product_id)
);

-- Orders (order-service)
CREATE TYPE order_status AS ENUM (
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'completed',
    'cancelled'
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0)
);

-- Kitchen tickets (kitchen-service)
CREATE TYPE kitchen_status AS ENUM ('queued', 'preparing', 'ready');

CREATE TABLE kitchen_tickets (
    id SERIAL PRIMARY KEY,
    order_id UUID NOT NULL UNIQUE,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    status kitchen_status NOT NULL DEFAULT 'queued',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications (notification-service)
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    order_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data
INSERT INTO products (name, description, price, category) VALUES
    ('Classic Burger', 'Beef patty, lettuce, tomato, pickles', 89.00, 'burgers'),
    ('Cheese Burger', 'Beef patty with cheddar cheese', 95.00, 'burgers'),
    ('Crispy Chicken', 'Crispy chicken fillet with mayo', 92.00, 'burgers'),
    ('Veggie Deluxe', 'Plant-based patty with avocado', 99.00, 'burgers'),
    ('French Fries', 'Golden crispy fries', 35.00, 'sides'),
    ('Sweet Potato Fries', 'Seasoned sweet potato fries', 42.00, 'sides'),
    ('Onion Rings', 'Crispy battered onion rings', 38.00, 'sides'),
    ('Cola', 'Ice-cold cola 40cl', 28.00, 'drinks'),
    ('Milkshake Vanilla', 'Creamy vanilla milkshake', 45.00, 'drinks'),
    ('Milkshake Chocolate', 'Rich chocolate milkshake', 45.00, 'drinks');

INSERT INTO menus (name, active) VALUES
    ('Lunch Menu', true),
    ('Dinner Menu', true);

INSERT INTO menu_items (menu_id, product_id)
SELECT 1, id FROM products WHERE category IN ('burgers', 'sides', 'drinks');

INSERT INTO menu_items (menu_id, product_id)
SELECT 2, id FROM products;
