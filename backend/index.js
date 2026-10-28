import express from "express";
import cors from "cors";

const app = express();                                  // server names app

app.use(cors());                                        // lets the website talk to it 
app.use(express.json());                                // lets it read information sent to it in a standard format called JSON, needed for orders

app.get("/hello", (req, res) => {                       // when somone asks dor the address /hello, the answer will be the backend is working
    res.send("The backend is working");
});

app.post("/orders", (req, res) => {                     // When someone sends information to the address /ordersm run this.
    console.log("New order received:", req.body);       // Prints what has arrived 
    res.json({ message: "Order received"});             // Sends the answer back, so the webiste knows it worked.
});

app.listen(3001, () => {                            
    console.log("Backend running on port 3001");        // starts the server, listening on port 3001, and prints a message to confirm
});