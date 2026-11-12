import { useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_API_URL;

// The admin's list of every order, newest first, with each order's lines.
function AdminOrders(props) {
    const [orders, setOrders] = useState([]);
    const [message, setMessage] = useState("");

    // Ask the backend for all the orders, sending the admin's token.
    function loadOrders() {
        setMessage("");
        fetch(API_URL + "/orders", {
            headers: { Authorization: "Bearer " + props.auth.token }
        })
            .then(async (response) => {
                if (!response.ok) {
                    setMessage("Could not load the orders. Please log in again.");
                    return [];
                }
                return response.json();
            })
            .then((data) => setOrders(Array.isArray(data) ? data : []));
    }

    // Load them once when the section appears.
    useEffect(() => {
        loadOrders();
    }, []);

    return (
        <section>
            <h3>Orders</h3>
            <button onClick={() => loadOrders()}>Refresh</button>
            <p>{message}</p>
            {orders.length === 0 && !message && <p>No orders yet.</p>}

            {orders.length > 0 && (
                <div className="orders-scroll">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Address</th>
                                <th>Items</th>
                                <th>Status</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td>{order.reference}</td>
                                    <td>{order.name}</td>
                                    <td>{order.email}</td>
                                    <td>{order.address}</td>
                                    <td>
                                        {order.items.map((item) => (
                                            <div key={item.id}>
                                                {item.name} {item.colour} ({item.size}) x {item.quantity}
                                            </div>
                                        ))}
                                    </td>
                                    <td>{order.status}</td>
                                    <td>£{order.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default AdminOrders;