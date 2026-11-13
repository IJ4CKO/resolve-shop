# RESOLVE

A clothing e-commerce shop. Customers browse, search and filter products, add them to a basket and pay by card (Stripe, test mode). Admins manage products, stock and orders.

**Stack:** React + Vite (website), Node + Express (backend), PostgreSQL on Neon (database), Stripe embedded Checkout (payments), Render (hosting).

## Run it locally

A Postgres database (Neon works).

**Backend** (`backend/`)
1. `cd backend && npm install`
2. Copy `.env.example` to `.env` and fill in every value (see Settings).
3. Create the tables: run `schema.sql` against a new, empty database (it is for first-time setup only).
4. Add the products: `node seed.js`
5. Create an admin: set `NEW_ADMIN_EMAIL` and `NEW_ADMIN_PASSWORD` (at least 12 characters) in your terminal only, then run `node create-admin.js`. Never put the password in a file or in chat.
6. Start: `node index.js` (runs on port 3001).

**Website** (project root)
1. `npm install`
2. Copy `.env.example` to `.env` and fill in both values.
3. `npm run dev`

**Payments locally:** Stripe cannot reach your laptop, so run the Stripe CLI in a separate window:
`stripe listen --forward-to localhost:3001/stripe/webhook`
It prints a `whsec_...` value. Put that in the backend `.env` as `STRIPE_WEBHOOK_SECRET` and restart the backend.

## Settings

| Where | Setting | What it is |
|---|---|---|
| backend/.env | `DATABASE_URL` | Neon connection string |
| backend/.env | `JWT_SECRET` | Long random text used to sign login tokens |
| backend/.env | `STRIPE_SECRET_KEY` | Stripe test secret key (`sk_test_...`) |
| backend/.env | `STRIPE_WEBHOOK_SECRET` | Signing secret for the webhook (`whsec_...`) |
| backend/.env | `FRONTEND_URL` | Website address, used for Stripe return links |
| backend/.env | `PORT` | Optional. Render sets it; defaults to 3001 |
| root .env | `VITE_API_URL` | Backend address |
| root .env | `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe test publishable key (`pk_test_...`) |

To make a `JWT_SECRET`, run this and paste the result in:

```
node -e "console.log(crypto.randomBytes(48).toString('hex'))"
```

`.env` files are git-ignored. Only the `.env.example` files (placeholders) are committed. On Render the same settings are entered in each service's Environment page.

## Roles

- **Visitor:** browse, search, buy as a guest.
- **Customer:** registered account. Orders are linked to the account; can see "My orders" and change password.
- **Admin:** everything above plus the Admin page (products, variants, stock, hide/show, all orders). Roles are set by the server only; registering always creates a customer.

## How a payment works

1. Checkout sends the basket (variant ids and quantities only) to `POST /orders`.
2. The server looks up real prices and stock, saves a **pending** order, takes stock off, and creates a Stripe Checkout Session.
3. The website shows Stripe's embedded card form using the returned `clientSecret`.
4. Stripe calls `POST /stripe/webhook`. `checkout.session.completed` marks the order **paid**; `checkout.session.expired` (30 minutes unpaid) marks it **cancelled** and returns the stock.
5. A repeated submit with the same idempotency key returns the existing order instead of creating another.

Test card: `4242 4242 4242 4242`, any future date, any 3 digits. Test mode only: no real money moves.

## Search

`GET /products` accepts `search`, `category`, `colour`, `minPrice`, `maxPrice`, `inStock` and `sort` (`price_asc`, `price_desc`, `name_asc`). Sorting uses a whitelist, and all values go in as SQL parameters.

## Releasing a change

1. Work on a branch, open a pull request, merge.
2. In Render: deploy the **backend** first, then the **website** (auto-deploy is off).
3. Test live: browse, search, buy with the test card, confirm the order turns `paid`.

