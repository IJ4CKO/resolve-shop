import { useState } from "react";
import { Link } from "react-router-dom";
import Login from "./Login.jsx";

// One page for everyone: log in, create an account, or (when logged in) see who you are.
function Account(props) {
    const [creating, setCreating] = useState(false);

    // Logged in: show who, where to go next, and a way to log out.
    if (props.auth) {
        return (
            <section className="account-page">
                <h2>Your account</h2>
                <p>Logged in as {props.auth.email}</p>
                {props.auth.role === "admin" ? (
                    <Link to="/admin">Go to the admin page</Link>
                ) : (
                    <Link to="/my-orders">My orders</Link>
                )}
                <button onClick={() => props.onLogout()}>Log out</button>
            </section>
        );
    }

    // Not logged in: the login form, or the create-account form.
    return (
        <section className="account-page">
            <h2>{creating ? "Create an account" : "Log in"}</h2>
            <Login register={creating} onLogin={props.onLogin} />
            <button onClick={() => setCreating(!creating)}>
                {creating ? "I already have an account" : "Create an account"}
            </button>
        </section>
    );
}

export default Account;