import { useState, useRef } from "react";
import { Link } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;

function Checkout(props) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [busy, setBusy] = useState(false);          // true while the order is being sent
    const [errors, setErrors] = useState([]);          // messages from the backend, if it refuses
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
                if (response.ok && data.url) {
                    // The order is saved. Send the customer to Stripe's payment page.
                    window.location.href = data.url;
                } else if (response.ok) {
                    // A repeated request: the order already exists and has no new payment page.
                    setErrors(["This order was already submitted."]);
                } else {
                    setErrors(data.errors || [data.message || "Something went wrong"]);
                }
            })
            .catch(() => setErrors(["Could not reach the shop. Please try again."]))
            .finally(() => setBusy(false));
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
                    <li key={item.id}>{item.name} {item.colour} ({item.size}) £{item.price} x {item.quantity}</li>
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

export default Checkout;