import { useState } from "react";                                         // brings the memory tool into the file.

function Checkout(props) {                                                     // starts the component and gives it its name.
    const [name, setName] = useState("");                                 // creates the memory, name holds whats typed. setName changes it. "" means it starts empty.
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");

    function placeOrder() {
        fetch("http://localhost:3001/orders", {                         // Fetch (....) sends a request to the address in the brackets
            method: "POST",                                             // Says we are sending information, not asking for a page
            headers: { "Content-Type": "application/json" },            // tells the backend the information is written as JSON
            body: JSON.stringify({                                      // Is the information itself, packed into text: customer;s details, the basket and the total
                name: name,
                email: email,
                address: address,
                items: props.basket,
                total: props.totalPrice
            })
        });
    }
    return (                                                              // says "show what's in the brackets". 
        <section>                                                         {/* is a box that holds the page's content */}
            <h2>Checkout</h2>                                             {/* is a heading with the word Checkout */}
            <input                                                        // is the box
                placeholder="Full Name"                                   // The grey hint text within the box
                value={name}                                              // makes the box show whatever is in memory
                onChange={(e) => setName(e.target.value)}                 // runs every time someone types, and saves whats typed into memory
            />

            <input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                placeholder="Delivery address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
            />

            <h3>Your order</h3>
            <ul>
                {props.basket.map((item) => (
                    <li key={item.id}>{item.name} {item.colour} £{item.price} x {item.quantity} </li>
                ))}
            </ul>
            <p>Total: £{props.totalPrice}</p>

            <button onClick={() => placeOrder()}>Place order</button>           {/* when clicking Place order button, name, email and address are stored in the browsers hidden pannel*/ }

        </section>                                                        // closes the pages content box
    );
}

export default Checkout;                                                  // lets other files use this one, in the same way the  other pages do