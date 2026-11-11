import { useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;

// A form for logging in, or (with register) for creating a customer account.
// When it works, it hands the result (token, role, email) to onLogin.
function Login(props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    // The two forms are identical apart from which backend address they use.
    const path = props.register ? "/auth/register" : "/auth/login";

    function submit() {
        setMessage("");
        fetch(API_URL + path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, password: password })
        })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    // Login sends a "message", and register sends a list called "errors".
                    setMessage(data.message || (data.errors && data.errors.join(", ")) || "Something went wrong");
                    return;
                }
                setPassword("");
                props.onLogin(data);
            })
            .catch(() => setMessage("Could not reach the shop"));
    }

    return (
        <div>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={() => submit()}>{props.register ? "Create account" : "Log in"}</button>
            <p>{message}</p>
        </div>
    );
}

export default Login;