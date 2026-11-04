import { useState, useEffect } from "react";
import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import About from "./About.jsx";
import Basket from "./Basket.jsx";
import Checkout from "./Checkout.jsx";
import Orders from "./Orders.jsx";
import { IoBagOutline } from "react-icons/io5";

const products = [
  { id: 1, name: "T-Shirt", category: "T-Shirts", colour: "White", price: 20, image: "/T-shirt/tshirt-white.png" },
  { id: 2, name: "T-Shirt", category: "T-Shirts", colour: "Grey", price: 20, image: "/T-shirt/tshirt-grey.png" },
  { id: 3, name: "T-Shirt", category: "T-Shirts", colour: "Royal Blue", price: 20, image: "/T-shirt/tshirt-royalblue.png" },
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

  const [size, setSize] = useState("");
  const sizes = ["S", "M", "L", "XL", "XXL"];

  return (
    <div className="product-card">
      <img src={props.image} alt={props.name} />
      <h2>{props.name}</h2>
      <p className="product-colour">{props.colour}</p>
      <p className="product-price">£{props.price}</p>

      {/* .map() makes one small button for each size. CLicking it stores it with setSize. The one that matches the stored size gets an extra class, selected, so it looks different */}
      <div className="size-options">
        {sizes.map((s) => (
          <button
          key={s}
          className={size === s ? "size-button selected" : "size-button"}
          onClick={() => setSize(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* When the button is clicked, it calls onAdd (addToBasket from App)
        and it passes the product and size. disabled greys out the button until a size has been picked.*/}
      <button disabled={size === ""} onClick={() => props.onAdd(props.product, size)}>Add to Basket</button>
    </div>
  );
}

function App() {
  //basket is the list of items the customer has chosen so far
  //setBasket is the function used to replace the basket with a new one, and tells React to redraw the page
  //useState([]) starts as an empty array because the basket starts as empty and holds a list of products.
  const [basket, setBasket] = useState([]);

  //message shows the words to show and setMessage changes the message. useState("") starts as an empty string.
  const [message, setMessage] = useState("");

  // When the message changes, wait 2 seconds to clear it.
  useEffect(() => {
    if (message === "") {
      return;
    }
    const timer = setTimeout(() => {
      setMessage("");
    }, 2000);

    // If a new message arrives first, cancel the old timer
    return () => clearTimeout(timer);
  }, [message]);

  // the 0 at the end of .reduce() is the starting value of the running total.
  const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = basket.reduce((sum, item) => sum + item.price * item.quantity, 0);
  //addToBasket(product) receives the product we want to add, 
  //...basket copies the existing items into a new array,
  //product adds the selected product to the new array,
  //setBasket() tells react to update the basket state
  //a new array is used because React only redraws the page when it is given a new array
  // : item keeps every other item the same.
  function addToBasket(product, size) {
    // everytime something is added the message joins the name and colour of the product together with "added to basket" and stores it in message, which React redraws on the page.
    setMessage(product.name + " " + product.colour + " (" + size + ") added to basket");
    const exists = basket.find((item) => item.id === product.id && item.size === size);
    if (exists) {
      setBasket(
        basket.map((item) =>
          item.id === product.id && item.size === size
            // the ... means take everything from this object, for Hoodie it would be id, name, price and quantity
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );

    } else {
      setBasket([...basket, { ...product, size: size, quantity: 1 }]);
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
          item.id === product.id && item.size === product.size

            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    } else {
      setBasket(basket.filter((item) => !(item.id === product.id && item.size === product.size)));

    }
  }

  // All means no filter has been applied yet
  const [category, setCategory] = useState("All");

  const shownProducts =
    category === "All" ? products : products.filter((product) => product.category === category);

    const featuredProducts = [1, 6, 9].map((id) => products.find((product) => product.id === id));

    const gridProducts = category === "All" ? featuredProducts : shownProducts;

  return (
    <div>
      <nav className="navbar">
        <Link to="/" className="logo" onClick={() => setCategory("All")}>RESOLVE.</Link>

        <div className="nav-links">
          <div className="clothing-dropdown">
            <span>Shop</span>
            <div className="clothing-dropdown-menu">
              <Link to="/" onClick={() => setCategory("T-Shirts")}>T-Shirts</Link>
              <Link to="/" onClick={() => setCategory("Hoodies")}>Hoodies</Link>
              <Link to="/" onClick={() => setCategory("Jeans")}>Jeans</Link>
            </div>
          </div>
          <Link to="/about">About</Link>
          <Link to="/basket"><IoBagOutline size={24} /></Link>
        </div>
      </nav>

      <div className="page">
        {/*Anything inside <Routes> changes with the address. Anything outside it, like the navbar, shows on every page.*/}
        <Routes>
          <Route
            path="/"
            element={
              <>
                <section className="hero">
                  <p className="hero-label">THE RESOLVE COLLECTION</p>
                  <h1> STRENGTH IN EVERYDAY</h1>
                  <p>Everyday comfort. Effortless style.</p>
                  {/* href="#categories" makes the button scroll down to the element with id="categories" */}
                  <a href="#categories" className="hero-button">SHOP COLLECTION</a>
                </section>

                <h2 className="section-title">SHOP BY CATEGORY</h2>
                <div className="category-tiles" id="categories">
                  <a href="#products" className="category-tile" onClick={() => setCategory("T-Shirts")}>T-SHIRTS</a>
                  <a href="#products" className="category-tile" onClick={() => setCategory("Hoodies")}>HOODIES</a>
                  <a href="#products" className="category-tile" onClick={() => setCategory("Jeans")}>JEANS</a>
                </div>

                <h2 className="section-title" id="products">{category === "All" ? "Featured Products" : category.toUpperCase()}</h2>
                <ul className="product-grid">
                  {/* .map() repeats what is inside it for each product. 
                  key gives each item a unique label so React can tell them apart*/}
                  {gridProducts.map((product) => (
                    <li key={product.id}>
                      {/* hands the card its name, price, the whole product and onAdd (the addToBasket function)*/}
                      <ProductCard name={product.name} price={product.price} onAdd={addToBasket} product={product} image={product.image} colour={product.colour} />
                    </li>
                  ))}
                </ul>
                <section className="brand-band">
                  <h2>MORE THAN CLOTHING</h2>
                  <p> A mindset built on resilience, individuality and determination.</p>
                </section>
              </>
            }
          />



          {/* When the address is /about, show the About page*/}
          < Route path="/about" element={< About />} />

          {/* When the address is /checkout, show the Checkout page */}
          < Route path="/checkout"
            element={
              < Checkout
                basket={basket}
                totalPrice={totalPrice}
              />} />

          <Route path="/orders" element={<Orders />} />


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
        {message && <div className="toast">{message}</div>}
      </div>
    </div>
  );
}


export default App;
