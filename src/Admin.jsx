import { useState, useEffect } from "react";
import Login from "./Login.jsx";
const API_URL = import.meta.env.VITE_API_URL;

function Admin(props) {
    const [products, setProducts] = useState([]);
    const [message, setMessage] = useState("");

        // Ask the backend for every product. Called when logged in, and again after any change.
    function loadProducts() {
        fetch(API_URL + "/admin/products", {
            headers: { Authorization: "Bearer " + props.auth.token }
        })
            .then((response) => {
                if (!response.ok) {
                    setMessage("Could not load the products. Please log in again.");
                    return null;
                }
                return response.json();
            })
            .then((data) => {
                if (data) setProducts(data);
            });
    }

    // When someone logs in, load the products.
    useEffect(() => {
        if (props.auth && props.auth.role === "admin") {
            loadProducts();
        }
    }, [props.auth]);

    // Not logged in, or not an admin: show the login form.
    if (!props.auth || props.auth.role !== "admin") {
        return (
            <section className="admin-page">
                <h2>Admin</h2>
                <Login onLogin={props.onLogin} />
            </section>
        );
    }

        return (
        <section className="admin-page">
            <h2>Admin</h2>
            <p>Logged in as {props.auth.email}</p>
            <button onClick={() => props.onLogout()}>Log out</button>
            <p>{message}</p>

            {products.map((product) => (
                <div key={product.id} className="admin-product">
                    <h3>
                        {product.name} (£{product.price}) {product.active ? "" : "- hidden"}
                    </h3>
                    <p>{product.variants.length} variants</p>
                </div>
            ))}
        </section>
    );
}

export default Admin;