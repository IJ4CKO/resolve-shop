-- products: one row for each product, such as a Hoodie.
-- name and category, example Hoodie and Hoodies.
-- description starts empty and can be filled in later by an admin.
-- base_price is the standard price, such as 30.00.
-- active TRUE means it is on sale. It lets an admin hide a product without deleting it, keeping old orders intact.
-- created_at is when it was added.
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    base_price NUMERIC(10,2) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- variants: one row for each thing a customer can actually buy.
-- A product (such as a Hoodie) is the general idea. A variant is one colour and
-- size of it (such as the Black Hoodie in M), and it has its own photo and stock count.
--
-- product_id links each variant to its product. REFERENCES products(id) means it must
-- match a real product, so a variant can't point at a product that doesn't exist.
-- ON DELETE CASCADE means that if a product is deleted, its variants are deleted too.
--
-- stock can't go below zero (CHECK), and UNIQUE (product_id, colour, size) stops the
-- same colour and size being added twice for one product.
CREATE TABLE IF NOT EXISTS variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    colour TEXT NOT NULL,
    size TEXT NOT NULL,
    image TEXT NOT NULL DEFAULT '',
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    UNIQUE (product_id, colour, size)
);

-- users: one row for each account.
-- email is the login name, and it must be unique.
-- password_hash is the scrambled password, never the real one.
-- role is either admin or customer. It defaults to customer, so a new sign-up has no
-- special powers unless someone deliberately makes them an admin.
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- orders: one row for each purchase.
-- reference is a readable code for the order (such as RES-20261107-A4F2), so a customer
-- can quote it. It must be unique, so no two orders share one.
-- idempotency_key is a code the website makes for each checkout. UNIQUE means no two orders
-- can have the same key, which stops a double click or a retry creating two orders.
-- user_id links the order to a logged-in customer. It can be empty, because a guest
-- can check out without an account.
-- name, email and address are the delivery details the customer typed at checkout.
-- status is where the order is up to, and CHECK only allows pending, paid, shipped or
-- cancelled, so a typo can't be saved.
-- total is the price worked out by the server. The items in the order are not stored
-- here. They live in order_items, one row for each line.
-- stripe_session_id links the order to its Stripe payment, so the webhook can find it.
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    idempotency_key TEXT UNIQUE,
    user_id INTEGER REFERENCES users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
    total NUMERIC(10,2) NOT NULL,
    stripe_session_id TEXT UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- order_items: one row for each line of an order, such as two Black Hoodies in size M.
-- order_id links the line to its order. ON DELETE CASCADE means deleting an order also
-- deletes its lines.
-- variant_id points at the variant that was bought. If that variant is deleted later,
-- it becomes empty (SET NULL) instead of breaking the old order.
-- name, colour, size and unit_price are copies taken at the moment of purchase, so
-- changing a product's price or name later never rewrites an old order.
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES variants(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    colour TEXT NOT NULL,
    size TEXT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);
