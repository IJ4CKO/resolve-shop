import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

// Where Stripe sends the customer after paying: /order-success?reference=RES-...
function OrderSuccess(props) {
    const [params] = useSearchParams();
    const reference = params.get("reference");

    // The customer has paid, so empty the basket. This runs once, when the page opens.
    useEffect(() => {
        props.onClear();
    }, []);

    return (
        <section className="checkout">
            <h2>Thank you</h2>
            <p>Your order reference is <strong>{reference}</strong>.</p>
            <Link to="/">Continue shopping</Link>
        </section>
    );
}

export default OrderSuccess;