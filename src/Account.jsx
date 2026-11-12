import { useState } from "react";
import { Link } from "react-router-dom";
import Login from "./Login.jsx";
const API_URL = import.meta.env.VITE_API_URL;

// One page for everyone: log in, create an account, or (when logged in) see who you are and change your password.
function Account(props) {
    const [creating, setCreating] = useState(false);

    // For the change-password form. These sit up here, above any early return, because React needs
    // every useState to run in the same order each time.
    const [oldPw, setOldPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [pwMessage, setPwMessage] = useState("");

    // Send the current and the new password, with the login token.
    function changePassword() {
        setPwMessage("");
        fetch(API_URL + "/auth/change-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + props.auth.token
            },
            body: JSON.stringify({ currentPassword: oldPw, newPassword: newPw })
        })
            .then(async (response) => {
                const data = await response.json();
                if (response.ok) {
                    setOldPw("");
                    setNewPw("");
                    setPwMessage("Password changed");
                } else {
                    setPwMessage(data.message || (data.errors && data.errors.join(", ")) || "Could not change the password");
                }
            })
            .catch(() => setPwMessage("Could not reach the shop"));
    }

    // Logged in: show who, where to go next, the password form, and a way to log out.
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

                <h3>Change password</h3>
                <div className="admin-form">
                    <input type="password" placeholder="Current password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
                    <input type="password" placeholder="New password (10+ characters)" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                    <button onClick={() => changePassword()}>Change password</button>
                </div>
                <p>{pwMessage}</p>

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