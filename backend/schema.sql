/*name and category, example Hoodie and Hoodies. description, starts empty and can be filled in later by admin
base_price is the standard price, such as 30.00. actice:TRUE means it is on sale, letting an admin hide a product without deleting it, keeping old orders intact
created_at, when it was added.*/ 
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