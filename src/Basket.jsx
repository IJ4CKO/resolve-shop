import { Link } from "react-router-dom";

function Basket(props) {
    return (
        <section>
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

            {/* totalPrice adds up price x quantity for every item in the basket*/}
            <p>Total: £ {props.totalPrice}</p>
            <Link to="/checkout">Checkout</Link>
            <button onClick={() => props.onClear([])}>Clear all</button>
            </>
            )}
        </section>
    );
}

export default Basket;