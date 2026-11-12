import { useState, useEffect } from "react";
import Login from "./Login.jsx";
const API_URL = import.meta.env.VITE_API_URL;
import AdminOrders from "./AdminOrders.jsx";

// The categories the backend accepts. They must match the list in the backend exactly.
const CATEGORIES = ["T-Shirts", "Hoodies", "Jeans", "Joggers", "Quarter Zips", "Polo Shirts"];
// The sizes the backend accepts. They must match the list in the backend exactly.
const SIZES = ["S", "M", "L", "XL", "XXL"];

function Admin(props) {
    const [products, setProducts] = useState([]);
    const [message, setMessage] = useState("");
    const [newName, setNewName] = useState("");
    const [newCategory, setNewCategory] = useState("T-Shirts");
    const [newPrice, setNewPrice] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [variantProductId, setVariantProductId] = useState("");
    const [variantColour, setVariantColour] = useState("");
    const [variantSize, setVariantSize] = useState("M");
    const [variantStock, setVariantStock] = useState("");
    const [variantImage, setVariantImage] = useState("");

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

    // Change one variant's stock, then reload the list so the page shows the new number.
    function changeStock(variantId, newStock) {
        fetch(API_URL + "/admin/variants/" + variantId, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + props.auth.token
            },
            body: JSON.stringify({ stock: newStock })
        })
            .then(async (response) => {
                if (response.ok) {
                    setMessage("Stock updated");
                    loadProducts();
                } else {
                    const data = await response.json();
                    setMessage((data.errors && data.errors[0]) || "Could not update the stock");
                }
            });
    }

    // Hide or show a whole product, then reload the list.
    function setActive(productId, active) {
        fetch(API_URL + "/admin/products/" + productId, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + props.auth.token
            },
            body: JSON.stringify({ active: active })
        })
            .then(async (response) => {
                if (response.ok) {
                    setMessage(active ? "Product shown" : "Product hidden");
                    loadProducts();
                } else {
                    setMessage("Could not update the product");
                }
            });
    }

    // Not logged in, or not an admin: show the login form.
    if (!props.auth || props.auth.role !== "admin") {
        return (
            <section className="admin-page">
                <h2>Admin</h2>
                <Login onLogin={props.onLogin} />
            </section>
        );
    }

    // Add a product, then reload the list so it appears.
    function addProduct() {
        fetch(API_URL + "/admin/products", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + props.auth.token
            },
            body: JSON.stringify({
                name: newName,
                category: newCategory,
                basePrice: Number(newPrice),
                description: newDescription
            })
        })
            .then(async (response) => {
                const data = await response.json();
                if (response.ok) {
                    setMessage("Product added. Now add a colour and size to it, or it won't show in the shop.");
                    setNewName("");
                    setNewPrice("");
                    setNewDescription("");
                    loadProducts();
                } else {
                    setMessage((data.errors && data.errors.join(", ")) || "Could not add the product");
                }
            });
    }

        // Add a colour and size to a product, then reload the list so it appears.
    function addVariant() {
        if (variantProductId === "") {
            setMessage("Choose a product first");
            return;
        }
        fetch(API_URL + "/admin/products/" + variantProductId + "/variants", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + props.auth.token
            },
            body: JSON.stringify({
                colour: variantColour,
                size: variantSize,
                stock: Number(variantStock),
                image: variantImage
            })
        })
            .then(async (response) => {
                const data = await response.json();
                if (response.ok) {
                    setMessage("Variant added");
                    setVariantColour("");
                    setVariantStock("");
                    setVariantImage("");
                    loadProducts();
                } else {
                    setMessage((data.errors && data.errors.join(", ")) || "Could not add the variant");
                }
            });
    }

    return (
        <section className="admin-page">
            <h2>Admin</h2>
            <p>Logged in as {props.auth.email}</p>
            <button onClick={() => props.onLogout()}>Log out</button>
            <p>{message}</p>
            <h3>Add a product</h3>
            <div className="admin-form">
                <input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                    {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price in pounds"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                />
                <input placeholder="Description (optional)" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
                <button onClick={() => addProduct()}>Add product</button>
            </div>
                        <h3>Add a colour and size to a product</h3>
            <div className="admin-form">
                <select value={variantProductId} onChange={(e) => setVariantProductId(e.target.value)}>
                    <option value="">Choose a product</option>
                    {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} (id {p.id})</option>
                    ))}
                </select>
                <input placeholder="Colour, e.g. Black" value={variantColour} onChange={(e) => setVariantColour(e.target.value)} />
                <select value={variantSize} onChange={(e) => setVariantSize(e.target.value)}>
                    {SIZES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <input
                    type="number"
                    min="0"
                    placeholder="Stock"
                    value={variantStock}
                    onChange={(e) => setVariantStock(e.target.value)}
                />
                <input
                    placeholder="Image path, e.g. /Joggers/joggers-black.png"
                    value={variantImage}
                    onChange={(e) => setVariantImage(e.target.value)}
                />
                <button onClick={() => addVariant()}>Add variant</button>
            </div>

            {products.map((product) => (
                <div key={product.id} className="admin-product">
                    <h3>
                        {product.name} (£{product.price}) {product.active ? "" : "- hidden"}
                    </h3>
                    <button onClick={() => setActive(product.id, !product.active)}>
                        {product.active ? "Hide from shop" : "Show in shop"}
                    </button>
                    <table className="admin-table">
                        <thead>
                            <tr><th>Colour</th><th>Size</th><th>Stock</th></tr>
                        </thead>
                        <tbody>
                            {product.variants.map((variant) => (
                                <tr key={variant.id}>
                                    <td>{variant.colour}</td>
                                    <td>{variant.size}</td>
                                    <td>
                                        <input
                                            type="number"
                                            min="0"
                                            defaultValue={variant.stock}
                                            onBlur={(e) => changeStock(variant.id, Number(e.target.value))}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
            <AdminOrders auth={props.auth} />
        </section>
    );
}

export default Admin;