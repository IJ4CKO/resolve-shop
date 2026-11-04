//When the Orders page opens, useEffect runs once and uses fetch to ask the backend for the orders. 
// The backend reads them from the database and sends them back, and .map() turns each one into a table row.



import { useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_API_URL;

function Orders() {
    const [orders, setOrders] = useState([]);
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    // Ask the backend for the orders, sending the password along as a header
    function loadOrders() {
        fetch(API_URL + "/orders", {
            headers: { "x-admin-password": password }
        })
            .then((response) => {
                // If the backend said no, show a message and stop here
                if (!response.ok) {
                    setMessage("Wrong password");
                    setOrders([]);
                    return null;
                }
                setMessage("");
                return response.json();
            })
            .then((data) => {
                // Only store the ortders if we actually received some
                if (data) {
                    setOrders(data);
                }
            });
    }


    return (
        <section>
            <h2>Orders</h2>
            <input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={() => loadOrders()}>View orders</button>
            <p>{message}</p>
            <p>Number of orders: {orders.length}</p>

            {/* <table> is the whole grid */}
            <table>
                {/* <thead> is the heading part */}
                <thead>
                    {/* <tr> is one row */}
                    <tr>
                        {/* <th> is one heading cell */}
                        <th>Order</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Address</th>
                        <th>Items</th>
                        <th>Total</th>
                    </tr>
                </thead>
                {/* <tbody> is the part holding the data */}
                <tbody>
                    {/* Each order has a list of items stored inside it. I use .map() to go through the orders
                     ,and inside each one I use a second .map() to go through its items. */}
                    {/* orders.map goes through the list of orders and makes one row for each */}
                    {orders.map((order) => (
                        // key={order.id} gives each row its own label, so React can tell them apart
                        <tr key={order.id}>
                            {/* <td> is one cell in that row */}
                            <td>{order.id}</td>
                            <td>{order.name}</td>
                            <td>{order.email}</td>
                            <td>{order.address}</td>
                            <td>
                                {/* order.items.map(....) goes through the items in this order */}
                                {order.items.map((item) => (
                                    // key={item.id} gives each line its own label
                                    <div key={item.id}>
                                        {item.name} {item.colour} x {item.quantity}
                                    </div>
                                ))}
                            </td>
                            <td>£{order.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}

export default Orders;