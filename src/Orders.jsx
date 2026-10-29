//When the Orders page opens, useEffect runs once and uses fetch to ask the backend for the orders. 
// The backend reads them from the database and sends them back, and .map() turns each one into a table row.

import {useState, useEffect } from "react";

function Orders() {
    const [orders, setOrders] = useState([]);

    // useEffect means run this code when the page first appears.
    useEffect(() => {
        // fetch is asking the backend for every saved order.
        fetch("http://localhost:3001/orders")
        // .then = when the answer arrives do this next. response.json() turns the answer from text into something the page can use.
            .then((response) => response.json())
        // setOrders(data) store the orders in memory and that makes React redrwa the page with them.
            .then((data) => setOrders(data));
}, []);

    return (
        <section>
            <h2>Orders</h2>
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
                        <th>Total</th>
                    </tr>
                </thead>
                {/* <tbody> is the part holding the data */}
                <tbody>
                    {/* orders.map goes through the list of orders and makes one row for each */}
                    {orders.map((order) => (
                        // key={order.id} gives each row its own label, so React can tell them apart
                        <tr key={order.id}>
                            {/* <td> is one cell in that row */}
                            <td>{order.id}</td>
                            <td>{order.name}</td>
                            <td>{order.email}</td>
                            <td>{order.address}</td>
                            <td>£{order.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}

export default Orders;