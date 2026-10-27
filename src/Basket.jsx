function Basket(props) {
    return (
        <section>
            <h2>Your basket</h2>
            <ul>
                {/*basket.map shows the clothing name and £price when added to the basket for each item within basket*/}
                {props.basket.map((item) => (
                    <li key={item.id}>{item.name} {item.colour} £{item.price} x {item.quantity}
                        <button onClick={() => props.removeFromBasket(item)}>Remove from Basket</button>
                    </li>
                ))}
            </ul>
            {/* totalPrice adds up price x quantity for every item in the basket*/}
            <p>Total: £ {props.totalPrice}</p>
            <button onClick={() => props.onClear([])}>Clear all</button>
        </section>
    );
}

export default Basket;