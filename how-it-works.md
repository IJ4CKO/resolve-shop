Main.jsx:  
Is the entry point: it finds the root <div> in index.html and draws App into it, wrapped in the router. 

Imports StrictMode which is a development tool for highlighting potential problems in the application. Imports createRoot creates the root, the place in the page where React draws everything. Imports BrowserRouter helping to create navigation in React without refreshing the page. Imports index.css which has colours, fonts and some styles. Imports App from App.jsx Where the top-level components of the website are located. 

About.jsx:
This is where the description lives about the website and is displayed in the About on the website. About has no state, it just returns headings and paragraphs, and it's shown when the address is /about.

App.css:
This is where most of the styling for the website lives. App.css holds the styles for the specific parts, such as the grid, cards, navbar and phone layout.

App.jsx:
This is the top-level component. It holds the shared state (the basket, the message and the chosen category), the functions that change it, the navbar and the routes, and it hands data and functions down to the pages and cards.
The products are listed here with, id, name, category, colour, price and image. ProductCard contains the product image, price, size selections and Add To Basket button. When that button is clicked it calls onAdd (addToBasket from App) and it passes the product size.

The App function also lives here, this includes the basket which holds a list of items the customer has chosen so far, setBasket is the function used to replace the basket with a new one, and tells react to redraw the page. When a customer adds a product to the basket the const[message, setMessage] = useState("") shows what has been added to the basket and after 2 seconds the message disappears.

addToBasket sets the message as its first line and receives the product we want to add, .find() asks is a line with this id and size already in the basket 
    If it is, .map() creates a new basket where only that line has its quantity increased by one.
    If it isn't, it creates a new basket by copying the old lines and adding the product with its size and quantity of 1.
Either way, setBasket stores the new basket. A new array is needed because React only redraws when it's given one.

removeFromBasket receives the basket item that was clicked (labelled product). If its quantity is more than 1, basket.map goes through every item. The clicked one is copied and gets quantity - 1. otherwise there is only one left, so basket.filter keeps every item that is not the clicked one, which removes that line. Either way setBasket stores the new basket and React redraws the page.

shownProducts is the products matching the chosen category, filtered with .filter(). featuredProducts is the three chosen by id with [1, 6, 9].map(...). gridProducts is what the home page actually draws: the featured three when the category is "All" or shownProducts after a category is chosen. Displaying one T-Shirt, one Hoodie and one pair of Jeans. 

The navbar contains the RESOLVE. logo that when pressed takes you back to the home page via <Link to="/" className="logo" onClick={() => setCategory("All")}>RESOLVE.</Link>. When clicking on Shop a drop down menu will display T-Shirts, Hoodies, Jeans. The menu filter compares the category. About is also in the navbar and discussed above. The basket is displayed with a bag image where the customer can click and get taken to the basket page.

Anything displayed in the <Routes> changes with the address. Anything outside it, like the navbar, shows on every page.
gridProducts.map(..) repeats what is inside it for each product. The key gives each item a unique label so React can tell them apart.
App draws a ProductCard for each product and hands things to the card, not the function. It hands them to the ProductCard component: name, price, image and colour to display, plus onAdd (which is addToBasket) and the whole product, so the card can call onAdd when the button is clicked. Each card keeps its own size in local state (useState inside ProductCard), and the Add to Basket button stays disabled until one is picked.

The totals: totalItems and totalPrice are calculated with .reduce() from the basket, and not stored anywhere. That's why they update by themselves.

The Routes: App hands Basket the basket, removeFromBasket, the total and a clear function, and hands Checkout the basket and total.

Basket.jsx:
Is the basket page, shown at /basket. App hands it the basket, the total price and two functions, removeFromBasket and onClear, because basket lives in App and the page is only able to read what it is given. When the basket is empty a message shows "Your basket is empty". Otherwise it uses .map() to show each line, with its photo, name, colour, size, price and quantity, a Remove button for that line, then the total, a Checkout button that takes you to /checkout and a Clear all. 

Checkout.jsx:
Is the checkout page, shown at /checkout. App hands it basket and totalPrice. It keeps what the customer types in its own state, one useState for each of name, email and address, and shows a summary of the order and a demo notice. When Place order is pressed, placeOrder uses fetch to send a POST request to the backend's /orders address, built from API_URL, which comes from the VITE_API_URL setting. The body is the name, email, address, basket and total, packed as JSON.
basket in the body is sent under the name items. This is because the backend reads it as req.body.items, and that's what the database stores in the items column.

Orders.jsx:
is the shop owner's page, shown at /orders. It isn't linked from the navigation bar, so customers won't come across it, and the password is what actually protects the orders. It keeps the orders, the typed password and message in state. When View orders is pressed, loadOrders uses fetch to ask the backend for orders ( API_URL + "/orders) along with the password in the header {"x-admin-password": password}. The backend compares it with ADMIN_PASSWORD and replies with a 401 if it's wrong and a message will be displayed "Wrong password". If it is right, the orders are stored in state and shown in a table, with one row for each order and a second .map() for the items inside.

backend/index.js:
Is the backend, a small program that runs on Render and sits between the website, which runs in the customer's browser, and the database, which is on Neon. It runs on a server I control, so it can safely hold the secrets that the website can't.

Its tools:
- express: listens for requests at addresses (routes) and sends replies. express.json() lets it read the JSON that the website sends.
- cors: allows the website to ask the backend for things, even though they have different web addresses. Browsers block this unless the server says it's allowed.
- pg: is how the backend talks to Neon. It creates a pool (a set of ready-to-use connections), and pool.query sends one question down it.
- dotenv: reads the .env file when the backend starts.

It answers four routes:
- GET /hello: replies "The backend is working".
- GET /db-test: asks the database for the current time, so a reply proves the backend can reach it.
- POST /orders: reads the name, email, address, items and total from req.body, saves them with INSERT INTO, and replies with the new order's number. The $1, $2... blanks stop the customer's typing being treated as code. A try / catch means one failure doesn't crash the backend.
- GET /orders: first checks that the x-admin-password header matches ADMIN_PASSWORD, and replies with a 401 if it doesn't, sending nothing. If it matches, it sends back every saved order, newest first.

It reaches the database using DATABASE_URL, read with process.env.DATABASE_URL. On my computer it comes from backend/.env. On Render there's no .env, because it isn't on GitHub, so the same settings (DATABASE_URL and ADMIN_PASSWORD) are typed into Render's Environment page. It reads the port from process.env.PORT || 3001, meaning use Render's port if it gives one, otherwise use 3001.

.env ( in the backend folder)