import express from "express";
import cors from "cors";
// Reads env file as soon as the backend starts
import "dotenv/config";                                               
import pg from "pg";

// server named app
const app = express();   

// creates the set of connections, using the string from .env
const pool = new pg.Pool({                                              
    connectionString: process.env.DATABASE_URL 
});
// lets the website talk to it 
app.use(cors());  

// lets it read information sent to it in a standard format called JSON, needed for orders                                                      
app.use(express.json());  

// when somone asks for the address /hello, the answer will be the backend is working
app.get("/hello", (req, res) => { 
    res.send("The backend is working")                                      
});

 // When someone sends an order to /orders, save it in the database
app.post("/orders", async (req, res) => {                                     
    try{
        // Pull the details out of the request, so they can be used one by one
        const {name, email, address, items, total } = req.body; 

        // Add a new row to the orders table. The $1, $2... are blanks filled by the list below.
        const result = await pool.query(
            "INSERT INTO orders (name, email, address, items, total) VALUES ( $1, $2, $3, $4, $5) RETURNING id",
            [name, email, address, JSON.stringify(items), total]
        );
        
        // Send back the new order's number, so the website knows it worked.
        res.json({ message: "Order saved", orderId: result.rows[0].id });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Could not save the order"});
    }
});

// When someone asks for /orders, send back every saved order, newest first.
app.get("/orders", async (req, res) => {
    // Only carry on if the password sent with the request matches the admin password
    if (req.headers["x-admin-password"] !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Wrong password" });
    }
    try {
        const result = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
        res.json(result.rows);
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

const port = process.env.PORT || 3001; // use Render's door if it gives one, otherwise use 3001.

app.listen(port, () => {                            
    console.log("Backend running on port " + port);
})  