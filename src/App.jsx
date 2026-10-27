import { useState } from "react";
import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import About from "./About.jsx";

const products = [
  { id: 1, name: "T-Shirt", colour:"White", price: 20, image: "/T-shirt/tshirt-white.png" },
  { id: 2, name: "T-shirt", colour:"Grey", price: 20, image: "/T-shirt/tshirt-grey.png"},
  { id: 3, name: "T-shirt", colour:"Royal Blue", price: 20, image: "/T-shirt/tshirt-royalblue.png"},
  { id: 4, name: "Hoodie", colour:"Grey", price: 40, image: "/Hoodie/hoodie-grey.png"},
  { id: 5, name: "Hoodie", colour:"Black", price: 40, image: "/Hoodie/hoodie-black.png"},
  { id: 6, name: "Hoodie", colour:"White", price: 40, image: "/Hoodie/hoodie-white.png"},
  { id: 7, name: "Jeans", colour:"Blue", price: 45, image: "/Jeans/Jeans-blue.png"},
  { id: 8, name: "Jeans", colour:"Light Grey", price: 45, image: "/Jeans/Jeans-lightgrey.png"},
  { id: 9, name: "Jeans", colour:"Dark Grey", price: 45, image: "/Jeans/Jeans-darkgrey.png"}

];

//Props are how information is passed from a parent component to a child component
//ProductCard shows the name of the clothing piece and the price of it. It is also a reusable card,
// so every product is laid out the same way.
function ProductCard(props) {

  return (
    <div className="product-card">
      <img src={props.image} alt={props.name} />
      <h2>{props.name}</h2>
      <p>£{props.price}</p>

      {/* When the button is clicked, it calls onAdd (addToBasket from App)
        and it passes the product*/}
      <button onClick={() => props.onAdd(props.product)}>Add to Basket</button>
    </div>
  );
}

function App() {
  //basket is the list of items the customer has chosen so far
  //setBasket is the function used to replace the basket with a new one, and tells React to redraw the page
  //useState([]) starts as an empty array because the basket starts as empty and holds a list of products.
  const [basket, setBasket] = useState([]);

  // the 0 at the end of .reduce() is the starting value of the running total.
  const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = basket.reduce((sum, item) => sum + item.price * item.quantity, 0);
  //addToBasket(product) receives the product we want to add, 
  //...basket copies the existing items into a new array,
  //product adds the selected product to the new array,
  //setBasket() tells react to update the basket state
  //a new array is used because React only redraws the page when it is given a new array
  // : item keeps every other item the same.
  function addToBasket(product) {
    const exists = basket.find((item) => item.id === product.id);
    if (exists) {
      setBasket(
        basket.map((item) =>
          item.id === product.id
            // the ... means take everything from this object, for Hoodie it would be id, name, price and quantity
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );

    } else {
      setBasket([...basket, { ...product, quantity: 1 }]);
    }
  }

  // removeFromBasket receives the basket item that was clicked (labelled product).
  // If its quantity is more than 1, basket.map() goes through every item. The clicked
  // one is copied with ...item and gets quantity - 1, and : item keeps every other item the same.
  // Otherwise, there is only one left, so basket.filter() keeps every item that
  // is not the clicked one, which removes that line.
  // Either way, setBasket stores the new basket and React redraws the page.
  function removeFromBasket(product) {
    if (product.quantity > 1) {
      setBasket(
        basket.map((item) =>
          item.id === product.id

            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    } else {
      setBasket(basket.filter((item) => item.id !== product.id));

    }
  }

  return (
    <div>
      <nav className="navbar">
        <div className="nav-links">
        <Link to="/">Shop</Link>
        <Link to="/about">About</Link>
        </div>
        <span>RESOLVE</span>
        <span>Basket: £{totalPrice}</span>
      </nav>

      {/*Anything inside <Routes> changes with the address. Anything outside it, like the navbar, shows on every page.*/}
      <Routes>
        <Route
          path="/"
          element={
            <>
      <section className="hero">
        <h2>Dress with intent.</h2>
        <p>Everyday comfort, effortless style.</p>
      </section>

      <ul className="product-grid">
        {/* .map() repeats what is inside it for each product. 
          key gives each item a unique label so React can tell them apart*/}
      {products.map((product) => (
        <li key={product.id}>
          {/* hands the card its name, price, the whole product and onAdd (the addToBasket function)*/}
          <ProductCard name={product.name} price={product.price} onAdd={addToBasket} product={product} image={product.image}/>
        </li>
      ))}
    </ul>

      {/* basket is the array of products, totalItems adds up the quantity of every item in the basket.
          {} allows you to display that number in JSX*/}
      <button>Basket: {totalItems}</button>
      <ul>
        {/*basket.map shows the clothing name and £price when added to the basket for each item within basket*/}
        {basket.map((item) => (
          <li key={item.id}>{item.name} {item.colour} £{item.price} x {item.quantity} 
            <button onClick={() => removeFromBasket(item)}>Remove from Basket</button>
          </li>
        ))}
      </ul>
  {/* totalPrice adds up price x quantity for every item in the basket*/ }
  <p>Total: £ {totalPrice}</p>
  {/* setBasket([]) replaces the basket with an empty list. The count and total update by themselves, because they’re calculated from basket.*/ }
  <button onClick={() => setBasket([])}>Clear all</button>
    </>
          }
          />

  < Route path = "/about" element = {< About />} />
          </Routes >
          </div >
  );
}


export default App;
