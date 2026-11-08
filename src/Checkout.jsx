import { useState, useRef } from "react";                                       // brings the memory tool into the file.
import { Link } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;                           // stores the web address in a constant called API_URL 


function Checkout(props) {                                                     // starts the component and gives it its name.
    const [name, setName] = useState("");                                 // creates the memory, name holds whats typed. setName changes it. "" means it starts empty.
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [busy, setBusy] = useState(false);          // true while the order is being sent
    const [errors, setErrors] = useState([]);          // messages from the backend, if it refuses
    const [reference, setReference] = useState("");   // set when the order succeeds
    const keyRef = useRef(crypto.randomUUID());        // one key for this checkout

    function placeOrder() {
        // If an order is already being sent, a second click does nothing.
        if (busy) return;
        setBusy(true);
        setErrors([]);

        fetch(API_URL + "/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                email: email,
                address: address,
                idempotencyKey: keyRef.current,
                // Only which variant and how many. No prices: the server looks those up itself.
                items: props.basket.map((item) => ({ variantId: item.id, quantity: item.quantity }))
            })

        })
            .then(async (response) => {
                const data = await response.json();
                if (response.ok) {
                    setReference(data.reference);
                    props.onClear();
                } else {
                    setErrors(data.errors || [data.message || "Something went wrong"]);
                }
            })
            .catch(() => setErrors(["Could not reach the shop. Please try again."]))
            .finally(() => setBusy(false));

        }

        // After a successful order: show the reference. This comes BEFORE the empty-basket check,
        // because the basket is cleared on success and would otherwise show "Your basket is empty".
        if (reference) {
            return (
                <section className="checkout">
                    <h2>Thank you</h2>
                    <p>Your order reference is <strong>{reference}</strong>.</p>
                    <Link to="/">Continue shopping</Link>
                </section>
            );
        }

        if (props.basket.length === 0) {
            return (
                <section className="checkout">
                    <h2>Checkout</h2>
                    <p>Your basket is empty.</p>
                    <Link to="/">Continue shopping</Link>
                </section>
            );
        }

        return (
            <section className="checkout">
                <h2>Checkout</h2>
                <p className="demo-notice">
                    Demo shop: Please do not enter real card or personal details.
                </p>
                <input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input placeholder="Delivery address" value={address} onChange={(e) => setAddress(e.target.value)} />

                <h3>Your order</h3>
                <ul className="checkout-items">
                    {props.basket.map((item) => (
                        <li key={item.id + item.size}>{item.name} {item.colour} ({item.size}) £{item.price} x {item.quantity}</li>
                    ))}
                </ul>
                <p className="checkout-total">Total: £{props.totalPrice}</p>

                {errors.length > 0 && (
                    <ul className="checkout-errors">
                        {errors.map((message, index) => <li key={index}>{message}</li>)}
                    </ul>
                )}

                <button className="place-order" disabled={busy} onClick={() => placeOrder()}>
                    {busy ? "Placing order..." : "Place order"}
                </button>
            </section>
        );
    }


export default Checkout;                                                  // lets other files use this one, in the same way the  other pages do