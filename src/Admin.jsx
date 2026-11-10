import Login from "./Login.jsx";

function Admin(props) {
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
        </section>
    );
}

export default Admin;