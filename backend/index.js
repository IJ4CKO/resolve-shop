import express from "express";
import cors from "cors";
import "dotenv/config";                                         // Reads env file as soon as the backend starts
import pg from "pg";

const app = express();                                          // server names app
const pool = new pg.Pool({                                      // creates the set of connections, using the string from .env
    connectionString: process.env.DATABASE_URL 
});

app.use(cors());                                                // lets the website talk to it 
app.use(express.json());                                        // lets it read information sent to it in a standard format called JSON, needed for orders

app.get("/hello", (req, res) => {                               // when somone asks dor the address /hello, the answer will be the backend is working
    res.send("The backend is working");
});

app.post("/orders", (req, res) => {                             // When someone sends information to the address /ordersm run this.
    console.log("New order received:", req.body);               // Prints what has arrived 
    res.json({ message: "Order received"});                     // Sends the answer back, so the webiste knows it worked.
});

app.get("/db-test", async (req, res) => {                       // when visiting /db-test run this code. async means the function has to wait for the database, so it can pause while it waits. req is the request that arrived and res is the response sent back
    try {                                                       // attempt this code block. If anything goes wrong, jump to catch.
         const result = await pool.query("SELECT NOW()");       // Ask the database for the current time. await waits for the answer before moving on. The answer is stored in result
         res.json(result.rows[0]);                              // The database answers with a list of rows. We send back the first one as JSON    
    } catch (error) {                                           // Only returns if somethin gin "try" failed, and "error" holds what went wrong
        console.log(error);                                     // Print the error in the backend terminal so we can see what happened
        res.status(500).send("Could not reach the database");   // Tell the website it failed. 500 is the standard code for "the server had a problem"
    }
});

app.listen(3001, () => {                            
    console.log("Backend running on port 3001");                // starts the server, listening on port 3001, and prints a message to confirm
});