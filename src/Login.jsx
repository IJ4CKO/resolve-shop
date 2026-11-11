import { useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;

// A login form. When the login works, it hands the result (token, role, email) to onLogin.
function Login(props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

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
                setPassword("");
                props.onLogin(data);
            })
            .catch(() => setMessage("Could not reach the shop"));
    }

    return (
        <div>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={() => login()}>Log in</button>
            <p>{message}</p>
        </div>
    );
}

export default Login;