import express from "express";
import cors from "cors";
// Reads env file as soon as the backend starts
import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// server named app
const app = express();

// creates the set of connections, using the string from .env
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

// Makes a readable order reference such as RES-20261108-A4F2
function makeReference() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).slice(2, 6).toUpperCase();
    return "RES-" + date + "-" + random;
}

// requireAuth: reads the token from the request, checks it is genuine, and remembers who it is.
function requireAuth(req, res, next) {
    // The token arrives in a header that looks like: Authorization: Bearer eyJ...
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Please log in" });
    }

    try {
        // Verify throws an error if the token was changed or has expired.
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;         // now the route can read req.user.id and req.user.role
        next();
    } catch (error) {
        return res.status(401).json({ message: "Your login is invalid or has expired" });
    }
}

// requireRole("admin"): only lets through users with that role.
function requireRole(role) {
    return function (req, res, next) {
        if (req.user.role !== role) {
            return res.status(403).json({ message: "You do not have permission to do that" });
        }
        next();
    };
}


// lets the website talk to it 
app.use(cors());

// lets it read information sent to it in a standard format called JSON, needed for orders                                                      
app.use(express.json());


// Checks an incoming order and returns a list of problems. An empty list means it is fine.
function validateOrder(body) {
    const errors = [];

    if (!body.name || body.name.trim() === "") {
        errors.push("Name is required");
    }
    if (!body.email || !body.email.includes("@")) {
        errors.push("A valid email is required");
    }
    if (!body.address || body.address.trim() === "") {
        errors.push("Address is required");
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
        errors.push("The order must contain at least one item");
    } else {
        for (const item of body.items) {
            if (!Number.isInteger(item.variantId)) {
                errors.push("Every item needs a variantId");
            }
            if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
                errors.push("Quantity must be a whole number from 1 to 10");
            }
        }
    }
    if (!body.idempotencyKey || typeof body.idempotencyKey !== "string" || body.idempotencyKey.length < 8) {
        errors.push("An idempotencyKey is required");
    }

    return errors;
}

const CATEGORIES = ["T-Shirts", "Hoodies", "Jeans", "Joggers", "Quarter Zips", "Polo Shirts"];

// Checks a new product and returns a list of problems. An empty list means it is fine.
function validateProduct(body) {
    const errors = [];

    if (typeof body.name !== "string" || body.name.trim() === "") {
        errors.push("Name is required");
    }
    if (!CATEGORIES.includes(body.category)) {
        errors.push("Category must be one of: " + CATEGORIES.join(", "));
    }
    if (typeof body.basePrice !== "number" || body.basePrice <= 0) {
        errors.push("Price must be a number above 0");
    }
    if (body.description !== undefined && typeof body.description !== "string") {
        errors.push("Description must be text");
    }

    return errors;
}

const SIZES = ["S", "M", "L", "XL", "XXL"];

// Checks a new variant and returns a list of problems. An empty list means it is fine.
function validateVariant(body) {
    const errors = [];

    if (typeof body.colour !== "string" || body.colour.trim() === "") {
        errors.push("Colour is required");
    }
    if (!SIZES.includes(body.size)) {
        errors.push("Size must be one of: " + SIZES.join(", "));
    }
    if (!Number.isInteger(body.stock) || body.stock < 0) {
        errors.push("Stock must be a whole number, zero or more");
    }
    if (typeof body.image !== "string" || body.image.trim() === "") {
        errors.push("An image path is required");
    }

    return errors;
}

// when somone asks for the address /hello, the answer will be the backend is working
app.get("/hello", (req, res) => {
    res.send("The backend is working")
});

// POST /orders: validates the order, then looks up every variant in the database and works out the total on the server
// It also saves the order, its lines and the stock change in one transaction.
app.post("/orders", async (req, res) => {
    const errors = validateOrder(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        const items = req.body.items;
        const idempotencyKey = req.body.idempotencyKey;

        // If we have already saved an order with this key, return it and stop. Nothing is charged twice.
        const existing = await pool.query(
            "SELECT reference, total FROM orders WHERE idempotency_key = $1",
            [req.body.idempotencyKey]
        );
        if (existing.rows.length > 0) {
            return res.status(200).json({
                reference: existing.rows[0].reference,
                total: Number(existing.rows[0].total),
                duplicate: true
            });
        }

        // 1. Fetch every variant in the order, with its product, in one query.
        const variantIds = items.map((item) => item.variantId);
        const result = await pool.query(
            `SELECT v.id, v.colour, v.size, v.stock, p.name, p.base_price
            FROM variants v
            JOIN products p ON p.id = v.product_id
            WHERE v.id = ANY($1) AND p.active = TRUE`,
            [variantIds]
        );

        // 2. Make a lookup so we can find a variant by its id.
        const found = {};
        for (const row of result.rows) {
            found[row.id] = row;
        }

        // 3. Build each order line, using the PRICE FROM THE DATABASE, never from the browser.
        const lines = [];
        const problems = [];
        let total = 0;

        // If the same variant appears twice, add the quantities together first.
        const wanted = {};
        for (const item of items) {
            wanted[item.variantId] = (wanted[item.variantId] || 0) + item.quantity;
        }

        // Go through each different variant once, using the combined quantity.
        for (const variantId of Object.keys(wanted)) {
            const quantity = wanted[variantId];
            const variant = found[variantId];

            if (!variant) {
                problems.push("Item " + variantId + " is not available");
                continue;
            }

            // Refuse the line if there isn't enough stock.
            if (variant.stock < quantity) {
                problems.push(
                    variant.name + " " + variant.colour + " (" + variant.size + ") only has " + variant.stock + " left"
                );
                continue;
            }



            const unitPrice = Number(variant.base_price);
            lines.push({
                variantId: variant.id,
                name: variant.name,
                colour: variant.colour,
                size: variant.size,
                unitPrice: unitPrice,
                quantity: quantity
            });
            total += unitPrice * quantity;
        }

        if (problems.length > 0) {
            return res.status(400).json({ errors: problems });
        }

        // Save the order, its lines and the stock change together. If any step fails, nothing is kept.
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const reference = makeReference();
            const orderResult = await client.query(
                `INSERT INTO orders (reference, name, email, address, total, idempotency_key)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [reference, req.body.name.trim(), req.body.email.trim(), req.body.address.trim(), total, idempotencyKey]
            );
            const orderId = orderResult.rows[0].id;

            for (const line of lines) {
                // Take the stock off. The AND stock >= $1 means it only works if enough is left.
                const update = await client.query(
                    "UPDATE variants SET stock = stock - $1 WHERE id = $2 AND stock >= $1",
                    [line.quantity, line.variantId]
                );
                if (update.rowCount === 0) {
                    // Someone else bought it first, so undo everything and refuse.
                    await client.query("ROLLBACK");
                    return res.status(409).json({ errors: [line.name + " " + line.colour + " (" + line.size + ") just sold out"] });
                }

                // Save the line, with the name and price copied at this moment.
                await client.query(
                    `INSERT INTO order_items (order_id, variant_id, name, colour, size, unit_price, quantity)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [orderId, line.variantId, line.name, line.colour, line.size, line.unitPrice, line.quantity]
                );
            }

            await client.query("COMMIT");
            res.status(201).json({ reference, total, lines });
        } catch (error) {
            await client.query("ROLLBACK");
            // Two identical requests arrived at once, and the other one won. Return its order.
            if (error.code === "23505") {
                const again = await pool.query(
                    "SELECT reference, total FROM orders WHERE idempotency_key = $1",
                    [req.body.idempotencyKey]
                );
                if (again.rows.length > 0) {
                    return res.status(200).json({ reference: again.rows[0].reference, total: Number(again.rows[0].total), duplicate: true });
                }
            }
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Could not process the order" });
    }
});

// GET /orders: for the admin page. Sends back every order, newest first, each with its lines.
app.get("/orders", requireAuth, requireRole("admin"), async (req, res) => {
    try {
        // 1. All the orders, newest first.
        const ordersResult = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
        const orders = ordersResult.rows;

        // 2. All the lines that belong to those orders, in one query.
        const orderIds = orders.map((order) => order.id);
        const itemsResult = await pool.query(
            "SELECT * FROM order_items WHERE order_id = ANY($1) ORDER BY id",
            [orderIds]
        );

        // 3. Give each order its own lines.
        const withItems = orders.map((order) => ({
            ...order,
            items: itemsResult.rows.filter((item) => item.order_id === order.id)
        }));

        res.json(withItems);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Could not load the orders" });
    }
});

// when visiting /db-test run this code. async means the function has to wait for the database,
//  so it can pause while it waits. req is the request that arrived and res is the response sent back
app.get("/db-test", async (req, res) => {
    // attempt this code block. If anything goes wrong, jump to catch.                            
    try {
        // Ask the database for the current time. await waits for the answer before moving on. The answer is stored in result                                                       
        const result = await pool.query("SELECT NOW()");
        // The database answers with a list of rows. We send back the first one as JSON            
        res.json(result.rows[0]);
        // Only returns if something in "try" failed, and "error" holds what went wrong                                       
    } catch (error) {
        // Print the error in the backend terminal so we can see what happened                                                 
        console.log(error);
        // Tell the website it failed. 500 is the standard code for "the server had a problem"                                    
        res.status(500).send("Could not reach the database");
    }
});

// GET /products: when someone asks for /products, this sends back every product that is on
// sale, each with its colours, and each colour with its sizes and stock.
app.get("/products", async (req, res) => {
    // try means "attempt this". If anything goes wrong, the code jumps down to catch.
    try {
        // Ask the database for one flat row for every variant, joined to its product.
        // JOIN matches each variant's product_id to a product's id.
        // WHERE p.active = TRUE leaves out products that have been hidden.
        // ORDER BY keeps the rows in a steady order each time.
        const result = await pool.query(`
            SELECT
              p.id AS product_id, p.name, p.category, p.base_price,
              v.id AS variant_id, v.colour, v.size, v.image, v.stock
            FROM products p
            JOIN variants v ON v.product_id = p.id
            WHERE p.active = TRUE
            ORDER BY p.id, v.colour, v.id
        `);

        // This will hold the finished answer: a list of products.
        const products = [];

        // Go through the flat rows one at a time.
        for (const row of result.rows) {
            // Step 1: find this row's product in our list. A hoodie has 30 rows, so most of
            // the time it will already be there. If it isn't, create it and add it.
            let product = products.find((p) => p.id === row.product_id);
            if (!product) {
                product = {
                    id: row.product_id,
                    name: row.name,
                    category: row.category,
                    // Postgres sends prices as text ("40.00"), so Number() makes it a real number.
                    price: Number(row.base_price),
                    colours: []
                };
                products.push(product);
            }

            // Step 2: find this row's colour inside that product, or create it. The colour
            // holds the photo, and a list of sizes that we fill in next.
            let colour = product.colours.find((c) => c.colour === row.colour);
            if (!colour) {
                colour = { colour: row.colour, image: row.image, sizes: [] };
                product.colours.push(colour);
            }

            // Step 3: add this row's size to the colour. The variantId is what the basket and
            // checkout will use later, so the server can look up the real price and stock.
            colour.sizes.push({
                variantId: row.variant_id,
                size: row.size,
                stock: row.stock
            });
        }

        // Send the finished list back to whoever asked, as JSON.
        res.json(products);
    } catch (error) {
        // If something failed, print it in the backend terminal and tell the website.
        // 500 is the standard code for "the server had a problem".
        console.log(error);
        res.status(500).json({ message: "Could not load the products" });
    }
});

// POST /auth/login: checks an email and password, and sends back a signed token.
app.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    // Reject anything that isn't text, so odd data can't crash the checks below.
    if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        // 1. Find the user by email.
        const result = await pool.query(
            "SELECT id, email, password_hash, role FROM users WHERE email = $1",
            [email.trim().toLowerCase()]
        );
        const user = result.rows[0];

        // 2. Compare what was typed with the stored hash. If there is no such user, the answer is the same.
        const matches = user ? await bcrypt.compare(password, user.password_hash) : false;
        if (!matches) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // 3. Sign a token that says who this is and what role they have. It expires in 8 hours.
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }

        );

        res.json({ token, role: user.role, email: user.email });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Could not log in" });
    }
});

// POST /admin/products: adds a product. Only a logged-in admin can use it.
app.post("/admin/products", requireAuth, requireRole("admin"), async (req, res) => {
    const errors = validateProduct(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        const result = await pool.query(
            `INSERT INTO products (name, category, description, base_price)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [req.body.name.trim(), req.body.category, req.body.description || "", req.body.basePrice]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Could not add the product" });
    }
});

// POST /admin/products/:id/variants: adds one colour and size to a product, with its stock.
app.post("/admin/products/:id/variants", requireAuth, requireRole("admin"), async (req, res) => {
    const productId = Number(req.params.id);
    if (!Number.isInteger(productId)) {
        return res.status(400).json({ errors: ["The product id must be a number"] });
    }

    const errors = validateVariant(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        // Make sure the product exists first, so the message is clear.
        const product = await pool.query("SELECT id FROM products WHERE id = $1", [productId]);
        if (product.rows.length === 0) {
            return res.status(404).json({ errors: ["That product does not exist"] });
        }

        const result = await pool.query(
            `INSERT INTO variants (product_id, colour, size, image, stock)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [productId, req.body.colour.trim(), req.body.size, req.body.image.trim(), req.body.stock]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        // 23505 means this colour and size already exist for the product.
        if (error.code === "23505") {
            return res.status(409).json({ errors: ["That colour and size already exist for this product"] });
        }
        console.log(error);
        res.status(500).json({ message: "Could not add the variant" });
    }
});

// PATCH /admin/variants/:id: changes a variant's stock and/or image.
app.patch("/admin/variants/:id", requireAuth, requireRole("admin"), async (req, res) => {
    const variantId = Number(req.params.id);
    if (!Number.isInteger(variantId)) {
        return res.status(400).json({ errors: ["The variant id must be a number"] });
    }

    const errors = [];
    if (req.body.stock !== undefined && (!Number.isInteger(req.body.stock) || req.body.stock < 0)) {
        errors.push("Stock must be a whole number, zero or more");
    }
    if (req.body.image !== undefined && (typeof req.body.image !== "string" || req.body.image.trim() === "")) {
        errors.push("The image path must be text");
    }
    if (req.body.stock === undefined && req.body.image === undefined) {
        errors.push("Send a stock and/or an image to change");
    }
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        const result = await pool.query(
            `UPDATE variants
             SET stock = COALESCE($1, stock), image = COALESCE($2, image)
             WHERE id = $3 RETURNING *`,
            [req.body.stock ?? null, req.body.image ? req.body.image.trim() : null, variantId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ errors: ["That variant does not exist"] });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Could not update the variant" });
    }
});

const port = process.env.PORT || 3001; // use Render's door if it gives one, otherwise use 3001.

app.listen(port, () => {
    console.log("Backend running on port " + port);
});