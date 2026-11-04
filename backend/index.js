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

// when somone asks dor the address /hello, the answer will be the backend is working
app.get("/hello", (req, res) => { 
    res.send("The backend is working")                                      
});

 // When someone sends an order to /orders, savie it in the database
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


const port = process.env.PORT || 3001; // use Render's door if it gives one, otherwise use 3001.

app.listen(port, () => {                            
    console.log("Backend running on port " + port);
})                        