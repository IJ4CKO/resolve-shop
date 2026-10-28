import { useState } from "react";                                         // brings the memory tool into the file.

function Checkout(props) {                                                     // starts the component and gives it its name.
    const [name, setName] = useState("");                                 // creates the memory, name holds whats typed. setName changes it. "" means it starts empty.
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");

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

        </section>                                                        // closes the pages content box
    );
}

export default Checkout;                                                  // lets other files use this one, in the same way the  other pages do