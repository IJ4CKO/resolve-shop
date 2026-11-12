import { useState, useEffect } from "react";
import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import About from "./About.jsx";
import Basket from "./Basket.jsx";
import Checkout from "./Checkout.jsx";
import Orders from "./Orders.jsx";
import Admin from "./Admin.jsx";
import OrderSuccess from "./OrderSuccess.jsx";
import Account from "./Account.jsx";
import MyOrders from "./MyOrders.jsx";
import { IoBagOutline, IoPersonOutline } from "react-icons/io5";

const API_URL = import.meta.env.VITE_API_URL;

function ProductCard(props) {
  // The card receives the product (name, price) and one colour of it (photo and sizes).
  const product = props.product;
  const colour = props.colour;
  const [size, setSize] = useState("");

  // The size row the customer picked, so we can read its variantId and stock.
  const chosen = colour.sizes.find((s) => s.size === size);

  return (
    <div className="product-card">
      <img src={colour.image} alt={product.name} />
      <h2>{product.name}</h2>
      <p className="product-colour">{colour.colour}</p>
      <p className="product-price">£{product.price}</p>

      <div className="size-options">
        {colour.sizes.map((s) => (
          <button
            key={s.variantId}
            disabled={s.stock === 0}
            className={size === s.size ? "size-button selected" : "size-button"}
            onClick={() => setSize(s.size)}
          >
            {s.size}
          </button>
        ))}
      </div>

      <button
        disabled={!chosen}
        onClick={() => props.onAdd({ id: chosen.variantId, name: product.name, category: product.category, colour: colour.colour, price: product.price, image: colour.image }, size)}
      >
        Add to Basket
      </button>
    </div>
  );
}

function App() {

  const [basket, setBasket] = useState(() => {
    try {
      const saved = localStorage.getItem("basket");   //localStorage is a small store that can survive refreshes. Only holding text.
      return saved ? JSON.parse(saved) : [];          //JSON.parse turns it back into a list.
    } catch {
      return [];
    }
  });

  // Who is logged in: null means nobody. Otherwise { token, role, email }.
  const [auth, setAuth] = useState(null);

  // The catalogue loaded from the backend. It starts empty and fills in when the answer arrives.
  const [catalogue, setCatalogue] = useState([]);

  // The shop's search, sort and price choices. Empty means "not chosen".
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [colour, setColour] = useState("");
  const [inStock, setInStock] = useState(false);
  const [colours, setColours] = useState([]);   // every colour, for the menu

  // All means no category chosen yet
  const [category, setCategory] = useState("All");

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

  // Ask the backend for the catalogue, with the choices made so far. Runs on load and whenever a choice changes.
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim() !== "") params.set("search", search.trim());
    if (sort !== "") params.set("sort", sort);
    if (minPrice !== "") params.set("minPrice", minPrice);
    if (maxPrice !== "") params.set("maxPrice", maxPrice);
    if (colour !== "") params.set("colour", colour);
    if (inStock) params.set("inStock", "true");
    if (category !== "All") params.set("category", category);

    // If the choices change again before this answer arrives, the old answer is ignored.
    let ignore = false;
    fetch(API_URL + "/products?" + params.toString())
      .then((response) => response.json())
      .then((data) => {
        if (!ignore) setCatalogue(data);
      });
    return () => {
      ignore = true;
    };
  }, [search, sort, minPrice, maxPrice, colour, inStock, category]);
  // Load the list of colours once, for the colour menu.
  useEffect(() => {
    fetch(API_URL + "/colours")
      .then((response) => response.json())
      .then((data) => setColours(data));
  }, []);

  // Whenever the basket changes, save a copy in the browser.
  useEffect(() => {
    localStorage.setItem("basket", JSON.stringify(basket));   // JSON.stringify turns the basket into text.
  }, [basket]);

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

  // One entry for every colour of every product: 30 in total.
  const items = catalogue.flatMap((p) => p.colours.map((c) => ({ product: p, colour: c })));

  // Items matching the chosen category.
  const shownItems = category === "All" ? items : items.filter((item) => item.product.category === category);


  // Which colour of each product to feature on the home page.
  const featuredPicks = [
    { name: "T-Shirt", colour: "Royal Blue" },
    { name: "Hoodie", colour: "Burgundy" },
    { name: "Jeans", colour: "Blue" },
    { name: "Joggers", colour: "Navy Blue" },
    { name: "Quarter Zip", colour: "Cream" },
    { name: "Polo Shirt", colour: "White" }
  ];

  // Find each product and the chosen colour inside it. filter(Boolean) drops any pair that wasn't found,
  // for example if a product is hidden or renamed.
  const featuredItems = featuredPicks
    .map((pick) => {
      const product = catalogue.find((p) => p.name === pick.name);
      const colour = product && product.colours.find((c) => c.colour === pick.colour);
      return product && colour ? { product, colour } : null;
    })
    .filter(Boolean);

  // True when the customer has searched, sorted or set a price. Then we show every match, not just the featured row.
  const filtering = search.trim() !== "" || sort !== "" || minPrice !== "" || maxPrice !== "" || colour !== "" || inStock;
  const gridItems = category === "All" && !filtering ? featuredItems : shownItems;
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
              <Link to="/" onClick={() => setCategory("Joggers")}>Joggers</Link>
              <Link to="/" onClick={() => setCategory("Quarter Zips")}>Quarter Zip</Link>
              <Link to="/" onClick={() => setCategory("Polo Shirts")}>POLO SHIRTS</Link>

            </div>
          </div>
          <Link to="/about">About</Link>
          <div className="clothing-dropdown account-dropdown">
            <Link to="/account" title={auth ? "Your account (" + auth.email + ")" : "Log in"} className="account-link">
              <IoPersonOutline size={24} />
              {auth && <span className="account-dot" />}
            </Link>
            {auth && (
              <div className="clothing-dropdown-menu account-menu">
                <span className="account-menu-email">{auth.email}</span>
                {auth.role === "admin" ? <Link to="/admin">Admin</Link> : <Link to="/my-orders">My orders</Link>}
                <Link to="/account and password">Account</Link>
                <button className="account-menu-button" onClick={() => setAuth(null)}>Log out</button>
              </div>
            )}
          </div>
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
                  <a href="#products" className="category-tile" onClick={() => setCategory("Joggers")}>JOGGERS</a>
                  <a href="#products" className="category-tile" onClick={() => setCategory("Quarter Zips")}>QUARTER ZIPS</a>
                  <a href="#products" className="category-tile" onClick={() => setCategory("Polo Shirts")}>POLO SHIRTS</a>
                </div>

                <h2 className="section-title" id="products">{category === "All" ? (filtering ? "Results" : "Featured Products") : category.toUpperCase()}</h2>
                <div className="shop-controls">
                  <input placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} />
                  <select value={colour} onChange={(e) => setColour(e.target.value)}>
                    <option value="">All colours</option>
                    {colours.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="">Sort: featured</option>
                    <option value="price_asc">Price: low to high</option>
                    <option value="price_desc">Price: high to low</option>
                    <option value="name_asc">Name: A to Z</option>
                  </select>
                  <input type="number" min="0" placeholder="Min price (£)" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                  <input type="number" min="0" placeholder="Max price (£)" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                  <label>
                    <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> In stock only
                  </label>
                  <button onClick={() => { setSearch(""); setSort(""); setMinPrice(""); setMaxPrice(""); setColour(""); setInStock(false); setCategory("All"); }}>
                    Clear
                  </button>
                </div>
                {gridItems.length === 0 && filtering && <p>No products match your search.</p>}
                <ul className="product-grid">
                  {/* .map() repeats what is inside it for each product. 
                  key gives each item a unique label so React can tell them apart*/}
                  {gridItems.map((item) => (
                    <li key={item.product.id + item.colour.colour}>
                      <ProductCard product={item.product} colour={item.colour} onAdd={addToBasket} />
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
                auth={auth}
              />} />

          <Route path="/orders" element={<Orders />} />

          <Route
            path="/account"
            element={<Account auth={auth} onLogin={setAuth} onLogout={() => setAuth(null)} />}
          />

          <Route path="/my-orders" element={<MyOrders auth={auth} />} />

          <Route
            path="/admin"
            element={<Admin auth={auth} onLogin={setAuth} onLogout={() => setAuth(null)} />}
          />

          <Route path="/order-success" element={<OrderSuccess onClear={() => setBasket([])} />} />

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
