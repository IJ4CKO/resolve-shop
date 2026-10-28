import { useState } from "react";
import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import About from "./About.jsx";
import Basket from "./Basket.jsx";
import Checkout from "./Checkout.jsx";

const products = [
  { id: 1, name: "T-Shirt", category: "T-Shirts", colour: "White", price: 20, image: "/T-shirt/tshirt-white.png" },
  { id: 2, name: "T-shirt", category: "T-Shirts", colour: "Grey", price: 20, image: "/T-shirt/tshirt-grey.png" },
  { id: 3, name: "T-shirt", category: "T-Shirts", colour: "Royal Blue", price: 20, image: "/T-shirt/tshirt-royalblue.png" },
  { id: 4, name: "Hoodie", category: "Hoodies", colour: "Grey", price: 40, image: "/Hoodie/hoodie-grey.png" },
  { id: 5, name: "Hoodie", category: "Hoodies", colour: "Black", price: 40, image: "/Hoodie/hoodie-black.png" },
  { id: 6, name: "Hoodie", category: "Hoodies", colour: "Royal Blue", price: 40, image: "/Hoodie/hoodie-royalblue.png" },
  { id: 7, name: "Hoodie", category: "Hoodies", colour: "White", price: 40, image: "/Hoodie/hoodie-white.png" },
  { id: 8, name: "Jeans", category: "Jeans", colour: "Blue", price: 45, image: "/Jeans/Jeans-blue.png" },
  { id: 9, name: "Jeans", category: "Jeans", colour: "Light Grey", price: 45, image: "/Jeans/Jeans-lightgrey.png" },
  { id: 10, name: "Jeans", category: "Jeans", colour: "Dark Grey", price: 45, image: "/Jeans/Jeans-darkgrey.png" }

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

  // All means no filter has been applied yet
  const [category, setCategory] = useState("All");

  const shownProducts =
    category === "All" ? products : products.filter((product) => product.category === category);

  return (
    <div>
      <nav className="navbar">
        <div className="nav-links">
          <Link to="/" onClick={() => setCategory("All")}>Home</Link>
          <Link to="/about">About</Link>
          <div className="clothing-dropdown">
            <span>Products</span>
            <div className="clothing-dropdown-menu">
              <button onClick={() => setCategory("T-Shirts")}>T-Shirts</button>
              <button onClick={() => setCategory("Hoodies")}>Hoodies</button>
              <button onClick={() => setCategory("Jeans")}>Jeans</button>
            </div>
          </div>
        </div>
        <span>RESOLVE</span>
        <Link to="/basket">Basket: £{totalPrice}</Link>
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
                {shownProducts.map((product) => (
                  <li key={product.id}>
                    {/* hands the card its name, price, the whole product and onAdd (the addToBasket function)*/}
                    <ProductCard name={product.name} price={product.price} onAdd={addToBasket} product={product} image={product.image} />
                  </li>
                ))}
              </ul>
            </>
          }
          />
        


        {/* When the address is /about, show the About page*/}
        < Route path="/about" element={< About />} />

        {/* When the address is /checkout, show the Checkout page */}
        < Route path="/checkout"
                element ={
                < Checkout
                    basket={basket}
                    totalPrice={totalPrice}
                />} />
        

          {/* When the address is /basket, the Basket page is shown. The basket and its functions are passed as props */}
          <Route
            path="/basket"
            element={
              <Basket
                basket={basket}
                removeFromBasket={removeFromBasket}
                totalPrice={totalPrice}
                onClear={() => setBasket([])}
              />
            }
          />
        </Routes>
    </div>
  );
}


export default App;
