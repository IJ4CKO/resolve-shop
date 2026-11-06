# RESOLVE

RESOLVE is a clothing shop I built as a full-stack project: a React website, a Node backend and a PostgreSQL database, all hosted online.

**Live site:** https://resolve-shop.onrender.com

## What it does
- Browse six categories: T-Shirts, Hoodies, Jeans, Joggers, Quarter Zips and Polo Shirts
- Pick a size, add items to a basket, change quantities and remove items
- Check out with a name, email and delivery address
- Orders are saved in a database
- A password-protected admin page at `/orders` shows the saved orders
- Works on desktop and mobile

## How it's built
- **Website:** React and Vite, hosted on Render as a static site
- **Backend:** Node and Express, hosted on Render as a web service
- **Database:** PostgreSQL, hosted on Neon
- **Code:** stored on GitHub, and Render rebuilds the site when I push

## How it works
When a customer presses **Place order**, the website packs the checkout details and the basket into JSON and sends them to the backend with `fetch`. The backend receives them at `POST /orders` and saves them in the `orders` table in Neon. The admin page asks the backend for the orders with a password header, and the backend only replies if the password matches a secret stored on the server.

More detail on each file is in [how-it-works.md](how-it-works.md).

## Running it on your own computer
1. Install the website's packages and start it:
```
npm install
npm run dev
```
2. Create a `.env` file in the top folder containing `VITE_API_URL` (the backend's address).
3. In a second terminal, start the backend:
```
cd backend
npm install
node index.js
```
4. Create a `.env` file in the `backend` folder containing `DATABASE_URL` (a PostgreSQL connection string) and `ADMIN_PASSWORD`.

The `.env` files are not included in the repository, because they hold secrets.

## Notes
- This is a demo shop. No payment is taken, so please don't enter real details at checkout.
- The backend is on a free plan, so it sleeps when idle and the first request can take up to a minute.