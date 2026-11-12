import { useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;

// A form for logging in, or (with register) for creating a customer account.
// When it works, it hands the result (token, role, email) to onLogin.
function Login(props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);

    const path = props.register ? "/auth/register" : "/auth/login";

    function submit(event) {
        event.preventDefault();          // stops the browser reloading the page when the form is sent
        if (busy) return;
        setBusy(true);
        setMessage("");
        fetch(API_URL + path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, password: password })
        })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    setMessage(data.message || (data.errors && data.errors.join(", ")) || "Something went wrong");
                    return;
                }
                setPassword("");
                props.onLogin(data);
            })
            .catch(() => setMessage("Could not reach the shop"))
            .finally(() => setBusy(false));
    }

    return (
        <form className="auth-form" onSubmit={submit}>
            <label>
                Email
                <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
                Password
                <input
                    type="password"
                    autoComplete={props.register ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </label>
            <button type="submit" disabled={busy}>
                {busy ? "Please wait..." : props.register ? "Create account" : "Log in"}
            </button>
            <p className="auth-error">{message}</p>
        </form>
    );
}

export default Login;