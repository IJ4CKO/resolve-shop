import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;

// The logged-in customer's own orders, newest first.
function MyOrders(props) {
    const [orders, setOrders] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    // When someone is logged in, ask the backend for their orders, sending the token.
    useEffect(() => {
        if (!props.auth) return;

        fetch(API_URL + "/my/orders", {
            headers: { Authorization: "Bearer " + props.auth.token }
        })
            .then(async (response) => {
                if (!response.ok) {
                    setMessage("Could not load your orders. Please log in again.");
                    return [];
                }
                return response.json();
            })
            .then((data) => {
                setOrders(Array.isArray(data) ? data : []);
                setLoading(false);
            });
    }, [props.auth]);

    // Nobody logged in: point them to the account page.
    if (!props.auth) {
        return (
            <section className="account-page">
                <h2>My orders</h2>
                <p>Please <Link to="/account">log in</Link> to see your orders.</p>
            </section>
        );
    }

    return (
        <section className="account-page">
            <h2>My orders</h2>
            <p>{message}</p>
            {loading && !message && <p>Loading...</p>}
            {!loading && orders.length === 0 && !message && <p>You haven't placed any orders yet.</p>}

            {orders.map((order) => (
                <div key={order.id} className="my-order">
                    <h3>{order.reference}</h3>
                    <p>
                        {new Date(order.created_at).toLocaleDateString("en-GB")} · {order.status} · £{order.total}
                    </p>
                    <ul>
                        {order.items.map((item, index) => (
                            <li key={index}>
                                {item.name} {item.colour} ({item.size}) x {item.quantity}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </section>
    );
}

export default MyOrders;