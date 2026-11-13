# How RESOLVE works

## The big picture
The website (React) runs in the customer's browser and shows the pages. It never talks to the database or to Stripe's secret side directly. It sends requests to the backend (Express, on Render), which holds the secrets, checks everything, and talks to the database (Postgres on Neon) and to Stripe. The website is on Render too, as a static site.

## Main.jsx
Is the entry point: it finds the root <div> in index.html and draws App into it, wrapped in the router.

Imports StrictMode, a development tool for highlighting potential problems. Imports createRoot, which creates the root, the place in the page where React draws everything. Imports BrowserRouter, which lets the site change pages without refreshing. Imports index.css, which has colours, fonts and some styles. Imports App from App.jsx, where the top-level parts of the website are.

## About.jsx
Where the description of the brand lives, shown at /about. It has no state, it just returns headings and paragraphs.

## App.css
Where most of the styling lives: the grid, cards, navbar, checkout, admin pages and the phone layout.

## App.jsx
The top-level component. It holds the shared state, the functions that change it, the navbar and the routes, and it hands data and functions down to the pages and cards.

**The catalogue.** The products are no longer written in the file. `catalogue` starts empty and a `useEffect` asks the backend for `GET /products`. Each product has a list of colours, and each colour has a list of sizes with a `variantId` and stock. A variant is one colour in one size, and it is what gets bought.

**Search, sort and filters.** `search`, `sort`, `minPrice`, `maxPrice`, `colour`, `inStock` and `category` are all state. The catalogue effect builds the address from the choices that are not empty and runs again whenever one changes, so the backend does the filtering, not the browser. The `ignore` flag in that effect means that if the choices change again before an answer arrives, the old answer is thrown away. `colours` is loaded once from `GET /colours` for the colour menu. `filtering` is true when any choice is set: then the page shows every match, otherwise it shows the six featured items.

**ProductCard.** Shows the photo, name, colour, price and size buttons. Each card keeps its own chosen size in local state. A size with no stock is disabled, and Add to Basket stays disabled until a size is picked. It calls `onAdd` (addToBasket from App) with the product, including the chosen variant's id.

**The basket.** `basket` holds the lines the customer has chosen, and `setBasket` replaces it with a new one so React redraws. It is saved to localStorage whenever it changes, so it survives a refresh.
- addToBasket sets the message, then .find() asks if a line with this id and size is already there. If it is, .map() creates a new basket where only that line has quantity + 1. If not, it copies the old lines and adds the new one with quantity 1. A new array is needed because React only redraws when given one.
- removeFromBasket: if the quantity is more than 1, .map() copies the clicked line with quantity - 1. Otherwise .filter() keeps every line except the clicked one.
- totalItems and totalPrice are worked out with .reduce() and not stored anywhere, so they update by themselves. The price here is only for display. The real total is worked out again on the server.

**The message.** `message` shows "added to basket" and a timer clears it after 2 seconds.

**Login state.** `auth` is null when nobody is logged in, otherwise `{ token, role, email }`. It is saved in sessionStorage so a refresh does not log you out. On load, the code reads the middle part of the token, checks its `exp` (expiry) time, and throws the login away if it has expired. Using sessionStorage means the login ends when the tab closes.

**The navbar.** The RESOLVE. logo takes you home and resets the category. Shop opens a drop-down of categories. About links to /about. The person icon has a drop-down: logged out it links to /account to log in; logged in it shows the email, My orders (or Admin for an admin), Account, and Log out. The bag icon goes to /basket.

**The routes.** Anything inside <Routes> changes with the address; anything outside it, like the navbar, shows on every page. Routes: / (shop), /about, /checkout, /account, /my-orders, /admin, /order-success, /basket and a catch-all that shows "Page not found".

## Basket.jsx
The basket page, shown at /basket. App hands it the basket, the total and the two functions removeFromBasket and onClear, because the basket lives in App and the page can only read what it is given. If it is empty it says so. Otherwise .map() shows each line with photo, name, colour, size, price and quantity, a Remove button, the total, a Checkout button to /checkout and a Clear all.

## Checkout.jsx
The checkout page, shown at /checkout. It has two steps.
1. **Details.** The customer types name, email and address (one useState each). If logged in, the email is pre-filled. When they press Continue to payment, placeOrder sends a POST to `/orders` containing the name, email, address, an idempotency key, and the items as just `variantId` and `quantity`. No prices or total are sent, because the server looks those up itself. If someone is logged in the token goes in an Authorization header so the order is linked to their account.
2. **Payment.** If the backend accepts the order it sends back a `clientSecret`. Keeping that in state switches the page to Stripe's embedded card form (EmbeddedCheckoutProvider and EmbeddedCheckout), which is loaded using the publishable key. The card details go to Stripe, never to our backend.

The idempotency key is made once with crypto.randomUUID() and kept in useRef, so it stays the same if the component redraws. If the same key is sent twice, the backend returns the order it already has instead of creating another, so a double click cannot create two orders. `busy` also stops a second click while a request is running. Backend problems are shown as a list of errors.

## OrderSuccess.jsx
Where Stripe sends the customer after paying, at /order-success. It reads the order reference from the address and shows a thank-you, and clears the basket.

## Login.jsx, Account.jsx, MyOrders.jsx
- **Login.jsx:** one shared form used for both logging in and creating an account (a `register` prop switches which backend route it calls). One component, two uses, so the form is not written twice. event.preventDefault() stops the browser reloading the page when the form is sent, and `busy` stops a double submit. On success it hands `{ token, role, email }` up to App.
- **Account.jsx:** logged out it shows the login form, or the create-account form when the address has ?mode=register. Logged in it shows a change-password form, which asks for the current password first, so someone who finds a logged-in screen cannot change it.
- **MyOrders.jsx:** the customer's order history. It sends the token and shows only that person's orders.

## Admin.jsx and AdminOrders.jsx
Admin.jsx is the shop owner's page at /admin. If the person is not logged in as an admin it shows the login form. If they are, it loads every product (hidden ones too) from `/admin/products` using the token. From there an admin can add a product, add a colour and size with stock and an image path, change a variant's stock (it saves when the box loses focus), and hide or show a product. After each change it reloads the list. AdminOrders.jsx lists every order with its reference, status and lines. This replaces the old Orders.jsx and its password header. The page hides things from non-admins for convenience only. The real protection is on the backend.

## backend/index.js
The backend, a program running on Render that sits between the website and the database on Neon. It runs on a server I control, so it can safely hold secrets the website can't.

Its tools:
- express: listens for requests at addresses (routes) and sends replies. express.json() reads the JSON the website sends.
- cors: lets the website, which has a different address, ask the backend for things.
- pg: how the backend talks to Neon. A pool is a set of ready connections and pool.query sends one question.
- bcryptjs: hashes passwords so the real password is never stored.
- jsonwebtoken: creates and checks login tokens.
- stripe: creates payment sessions and checks webhooks.
- dotenv: reads the .env file when the backend starts.

**Middleware (checks that run before a route):**
- requireAuth reads the token from the Authorization header, checks it is genuine and not expired, and remembers who it is in req.user. A bad or missing token gets 401.
- requireRole("admin") then checks the role in the token. A logged-in non-admin gets 403. 401 means "who are you?", 403 means "you may not do that".
- optionalAuth is the same as requireAuth but lets guests through, used on orders so guests can buy and logged-in customers get their order linked.

**Public routes**
- GET /hello: replies that the backend is working. GET /db-test: asks the database for the time, so a reply proves it can be reached.
- GET /products: sends the catalogue with colours and sizes, with the search, category, colour, price, in-stock and sort choices. Values go in as $1, $2 placeholders so typing cannot be treated as code. Sorting uses a fixed list of allowed options, never text from the browser. Hidden products are left out.
- GET /colours: the list of colours for the menu.
- POST /auth/register: creates a customer. The role is set in the server code, never read from the request, so nobody can register themselves as admin. The password is hashed with bcrypt.
- POST /auth/login: finds the user, compares the password with the hash, and returns a token valid for 8 hours holding the user's id and role. A wrong email and a wrong password give the same message, so emails cannot be guessed.
- POST /orders: the checkout (see below).
- POST /stripe/webhook: Stripe's message about a payment (see below).

**Logged-in routes**
- GET /my/orders: the logged-in customer's orders. The user id comes from the token, not the request, so nobody can ask for someone else's.
- POST /auth/change-password: checks the current password, then saves the new hash.

**Admin routes** (requireAuth then requireRole("admin"))
- GET /orders: every order, newest first, with its lines.
- GET /admin/products: every product including hidden ones, with all variants.
- POST /admin/products: adds a product. POST /admin/products/:id/variants: adds a colour and size with stock.
- PATCH /admin/products/:id and PATCH /admin/variants/:id: change only the fields that were sent, using COALESCE so unsent fields keep their old value. Every input is checked first (validateProduct, validateVariant) against fixed lists of categories and sizes.

**POST /orders, step by step**
1. validateOrder checks the details and items. A bad request gets 400.
2. If an order with this idempotency key already exists, return it and stop.
3. Load every variant from the database in one query and work out the lines and total from the database prices, never from the browser. If the same variant appears twice the quantities are added. Not enough stock gives 400 with a clear message.
4. In one transaction (BEGIN ... COMMIT): insert the order as pending, then for each line take the stock off with `UPDATE ... AND stock >= $1` and save the line in order_items with the name and price copied at that moment. If the update changes no rows, someone else bought it first, so everything is rolled back and the reply is 409. A transaction means all of it happens or none of it does.
5. Create a Stripe Checkout Session (embedded mode, GBP, expires after 30 minutes) and return the clientSecret. If Stripe fails, the order is cancelled and the stock returned, and the reply is 502.
6. If two identical requests arrive at the same moment, the database's unique rule on the key rejects one (error 23505) and that one returns the winner's order.

**POST /stripe/webhook.** Stripe calls this, not the website. It sits above express.json() because checking Stripe's signature needs the raw, untouched body. A wrong signature gets 400, so a fake call is refused. checkout.session.completed changes the order from pending to paid. checkout.session.expired calls cancelPendingOrder, which marks it cancelled and gives the stock back. Both only act on orders still pending, so Stripe repeating a message is harmless. Only this webhook marks an order paid, never the browser.

Order statuses the database allows: pending (created, waiting for payment), paid, shipped and cancelled. The shop itself only ever sets pending, paid and cancelled. Nothing sets shipped yet, because there is no admin button for it. Each order has a readable reference like RES-20261108-A4F2.

## Database (backend/schema.sql)
- products: name, category, description, base_price, active (hidden products stay in the table).
- variants: one row per colour and size, with image and stock. Unique per product, colour and size.
- users: email, password_hash, role.
- orders: reference, name, email, address, total, status, user_id (empty for guests), idempotency_key (unique), stripe_session_id.
- order_items: the lines of an order, with name, colour, size and unit price copied at purchase time, so a later price change cannot change an old order.

Rules the database enforces itself: stock cannot go below zero (CHECK), a product cannot have the same colour and size twice (UNIQUE), role can only be admin or customer and defaults to customer, status can only be one of the four allowed words, and a quantity must be above zero. Deleting a product deletes its variants (ON DELETE CASCADE). Deleting a variant leaves old order lines intact, with variant_id set to empty (SET NULL).

seed.js fills the tables. It loops over 6 products, then each product's colours (30 colours in all), then the 5 sizes, and inserts one variant for each, 150 variants, each with 20 in stock. It stops straight away if products already exist, so running it twice does not duplicate everything. The image path is built from the folder, prefix and colour, which is why file names in public must match exactly.

create-admin.js creates an admin user. The email and password are read from two settings you set in the terminal before running it, NEW_ADMIN_EMAIL and NEW_ADMIN_PASSWORD (at least 12 characters), so the password is never written in a file or saved in Git. It hashes the password with bcrypt (the 12 is how much work the hashing does: higher is slower and safer) and saves only the hash with the role admin.

## Settings
backend/.env holds DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, FRONTEND_URL and PORT. The root .env holds VITE_API_URL and VITE_STRIPE_PUBLISHABLE_KEY. Only names starting VITE_ reach the website. If the secret values were public, anyone could forge logins or use the Stripe account, so the .env files stay on my computer and are listed in .gitignore. The .env.example files are committed with placeholders so someone else knows what to fill in. On Render there are no .env files, so the same settings are typed into each service's Environment page, with the live values.

## .gitignore
Tells Git what to leave out of its snapshots and off GitHub. It includes .env so secrets stay private, and node_modules, the large folder npm install can recreate.

## public folder
Holds the images, such as the product photos and the lookbook. Files in it are served as they are, so public/Hoodie/hoodie-black.png is reached at /Hoodie/hoodie-black.png. File names must match the paths in the database exactly, including capital letters, because the live server treats capitals as different.

## Three journeys
**Add to basket:** pick a size, press Add to Basket, ProductCard calls onAdd, addToBasket adds or increases the line, the basket state changes, React redraws, and the basket is saved to localStorage.

**Place and pay:** Basket, Checkout, details, Continue to payment, POST /orders (validated, priced from the database, stock reserved, pending order saved, Stripe session created), the card form appears, the customer pays, Stripe calls the webhook, the order becomes paid, and the customer lands on /order-success. If they never pay, the session expires and the stock goes back.

**Admin changes stock:** log in as admin, the token is saved, /admin loads the products with the token, the admin edits a stock box, on blur the website sends PATCH /admin/variants/:id, the backend checks the token and role then saves, and the list reloads with the new number.

## Release routine
Work on a branch, open a pull request and merge. In Render deploy the backend first, then the website (auto-deploy is off), then test live: browse, search, buy with the test card 4242 4242 4242 4242, and check the order turns paid. Stripe is in test mode only, so no real money moves.
