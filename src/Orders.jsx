import { useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;

function Orders() {
    const [orders, setOrders] = useState([]);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [token, setToken] = useState("");        // empty means "not logged in"
    const [message, setMessage] = useState("");

    // Send the email and password. If they are right, keep the token and load the orders.
    function login() {
        setMessage("");
        fetch(API_URL + "/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, password: password })
        })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    setMessage(data.message || "Could not log in");
                    return;
                }
                if (data.role !== "admin") {
                    setMessage("This account is not an admin");
                    return;
                }
                setToken(data.token);
                setPassword("");                    // don't keep the typed password around
                loadOrders(data.token);
            })
            .catch(() => setMessage("Could not reach the shop"));
    }

    // Ask for the orders, sending the token. If the backend refuses it, log out.
    function loadOrders(currentToken) {
        fetch(API_URL + "/orders", {
            headers: { Authorization: "Bearer " + currentToken }
        })
            .then((response) => {
                if (!response.ok) {
                    logout();
                    setMessage("Your login is invalid or has expired. Please log in again.");
                    return null;
                }
                return response.json();
            })
            .then((data) => {
                if (data) setOrders(data);
            });
    }

    function logout() {
        setToken("");
        setOrders([]);
        setEmail("");
        setPassword("");
        setMessage("");
    }
    return (
        <section className="orders-page">
            <h2>Orders</h2>

            {token === "" ? (
                <div>
                    <input
                        type="email"
                        placeholder="Admin email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button onClick={() => login()}>Log in</button>
                </div>
            ) : (
                <button onClick={() => logout()}>Log out</button>
            )}
            <p>{message}</p>
            {orders.length === 0 ? (
                <p>Enter the admin password and press View orders</p>
            ) : (
                <p>Number of orders: {orders.length}</p>
            )}

            {orders.length > 0 && (
                <div className="orders-scroll">
                    {/* <table> is the whole grid */}
                    <table className="orders-table">
                        {/* <thead> is the heading part */}
                        <thead>
                            {/* <tr> is one row */}
                            <tr>
                                {/* <th> is one heading cell */}
                                <th>Reference</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Address</th>
                                <th>Items</th>
                                <th>Status</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        {/* <tbody> is the part holding the data */}
                        <tbody>
                            {/* The backend attaches each order's lines, which are saved in their own table
                        . I use .map() to go through the orders.
                        ,and inside each one I use a second .map() to go through its items. */}
                            {/* orders.map goes through the list of orders and makes one row for each */}
                            {orders.map((order) => (
                                // key={order.id} gives each row its own label, so React can tell them apart
                                <tr key={order.id}>
                                    {/* <td> is one cell in that row */}
                                    <td>{order.reference}</td>
                                    <td>{order.name}</td>
                                    <td>{order.email}</td>
                                    <td>{order.address}</td>
                                    <td>
                                        {/* order.items.map(....) goes through the items in this order */}
                                        {order.items.map((item) => (
                                            // key={item.id} gives each line its own label
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
                </div >
            )}
        </section >

    );
}

export default Orders;