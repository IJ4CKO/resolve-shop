import { useNavigate } from "react-router-dom";

function Basket(props) {
    const navigate = useNavigate();

    return (
        <section className="basket-page">
            <h2>Your basket</h2>
            {/*props.basket.length === 0 ? is asking if the basket is empty
               <p> is the message displayed if it is empty. ) : ( means otherwise
                <> .... </> everything inside the invisible box */}
            {props.basket.length === 0 ? (
                <p>Your basket is empty.</p>
            ) : (
                <>
                    <ul>
                        {/*basket.map shows the clothing name and £price when added to the basket for each item within basket*/}
                        {props.basket.map((item) => (
                            <div className="basket-details">
                                <li key={item.id} className="basket-item">
                                    {item.name} {item.colour} £{item.price} x {item.quantity}
                                </li>
                                <img className="basket-image" src={item.image} alt={item.name} />
                                <button onClick={() => props.removeFromBasket(item)}>Remove from Basket</button>
                            </div>
                        ))}
                    </ul>

                    <div className="basket-summary">
                        {/* totalPrice adds up price x quantity for every item in the basket*/}
                        <p>Total: £ {props.totalPrice}</p>
                        <button className="checkout-button" onClick={() => navigate("/checkout")}>Checkout</button>
                        <button className="clear-button" onClick={() => props.onClear([])}>Clear all</button>
                    </div>
                </>
            )}
        </section>
    );
}

export default Basket;