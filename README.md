# CraveMate

**CraveMate** is a full-stack food delivery marketplace with separate customer, restaurant, delivery-partner, admin, realtime, and payment workflows.

> Upgraded from the original project with a complete CraveMate rebrand, a modern responsive UI, payment/cart reliability fixes, stronger authorization, safer service-to-service communication, and more defensive validation.

## Main features

### Customer
- Google OAuth sign-in and one-time role selection
- Geolocation-based discovery of nearby verified restaurants
- Restaurant search, menu browsing, availability state, and distance display
- Single-restaurant cart with increment/decrement and stale-cart cleanup
- Map-based saved delivery addresses with reverse geocoding
- Server-calculated subtotal, delivery fee, platform fee, and total
- Razorpay and Stripe checkout
- Paid-order history and order detail pages
- Realtime order-status updates via Socket.IO
- Live rider-location map during delivery

### Restaurant / seller
- Restaurant onboarding with image, contact information, description, and location
- Admin verification gate before opening the restaurant
- Open/close restaurant control
- Restaurant profile editing
- Menu item create/delete and availability controls
- Realtime paid-order notifications with optional sound alerts
- Controlled order workflow: placed → accepted → preparing → ready for rider
- Rider re-dispatch option when an order waits for a rider
- Real order summary cards for active orders, delivered orders, and food revenue

### Delivery partner
- Rider profile onboarding and admin verification
- Online/offline availability based on current geolocation
- Nearby rider matching around restaurant hotspots
- Realtime delivery request notifications
- Atomic order acceptance so two riders cannot claim the same order
- Current delivery details, customer call action, and earnings
- Pickup/delivered status flow
- Live map routing and secure rider-location broadcasting

### Admin
- Protected admin-only verification APIs
- Pending restaurant verification queue
- Pending rider verification queue
- Masked government-ID display in the UI

### Platform / infrastructure
- React + TypeScript + Vite + Tailwind CSS frontend
- Node.js + Express TypeScript microservices
- MongoDB / Mongoose (admin service uses MongoDB driver)
- RabbitMQ for payment and rider-dispatch events
- Socket.IO realtime service
- Cloudinary image upload service
- Razorpay + Stripe payments
- Leaflet / OpenStreetMap maps and routing
- Dockerfiles for backend services

## Services and local ports

| App / service | Default port |
|---|---:|
| Frontend | 5173 |
| Auth | 5000 |
| Restaurant / ordering | 5001 |
| Utils / payments / uploads | 5002 |
| Realtime | 5004 |
| Rider | 5005 |
| Admin | 5006 |

## Important fixes in this upgrade

- Cart is no longer deleted when a pending order is created. It is cleared only after confirmed payment.
- Payment cart cleanup is scoped to the paid restaurant, reducing cross-tab cart-loss risk.
- Stripe verification now requires `payment_status === paid`.
- Razorpay verification checks signature, gateway order receipt, payment/order relationship, and captured status.
- The frontend no longer exposes the internal backend service key.
- Rider location now goes through an authenticated rider endpoint before the realtime service is called.
- Cloudinary upload endpoint is protected by the internal service key.
- Seller order access is restricted to the seller's own restaurant.
- Seller and rider order-state transitions are validated on the server.
- Rider assignment checks payment, order readiness, existing assignment, and active rider orders.
- Socket context now uses reactive state so consumers reliably receive reconnecting sockets.
- Location permission failures are recoverable instead of leaving the UI in an endless loading state.
- JWT failures return 401 rather than surfacing as server errors.
- Admin service now connects to MongoDB during startup.
- Database/RabbitMQ dependencies initialize before services begin accepting requests.
- Browser CORS uses `FRONTEND_URL` instead of allowing every origin.
- Cart APIs validate item/restaurant ownership, availability, restaurant state, and quantity limits.
- Address and restaurant inputs receive stronger server-side validation.
- A seller cannot open an unverified restaurant.
- Account role selection is one-time rather than freely switchable through the API.
- Removed fake rating/delivery-time UI values and the unfinished `Sales Page` placeholder.

## Environment setup

Each app/service contains a safe `.env.example`. Copy each example to `.env` and replace placeholders with your own values.

Important rules:
1. Use the same `JWT_SEC` in auth, restaurant, rider, realtime, and admin services.
2. Use the same `INTERNAL_SERVICE_KEY` in restaurant, rider, realtime, and utils services.
3. Keep `INTERNAL_SERVICE_KEY` server-side only. Do **not** create a `VITE_INTERNAL_SERVICE_KEY`.
4. Configure Google OAuth for the frontend origin and the auth service credentials.
5. Set Stripe, Razorpay, Cloudinary, MongoDB, and RabbitMQ credentials before testing those features.
6. For production, change every `FRONTEND_URL` and `VITE_*_SERVICE` URL to the deployed HTTPS URL.

## Local development

Prerequisites: Node.js, npm, MongoDB, and RabbitMQ.

Install dependencies in each folder:

```bash
cd frontend && npm install
cd ../services/auth && npm install
cd ../restaurant && npm install
cd ../utils && npm install
cd ../realtime && npm install
cd ../rider && npm install
cd ../admin && npm install
```

Then run MongoDB and RabbitMQ, and start the services in separate terminals. A practical order is:

```text
1. auth
2. realtime
3. utils
4. restaurant
5. rider
6. admin
7. frontend
```

Inside each service/frontend folder:

```bash
npm run dev
```

## Existing database note

The upgraded default database name is `CraveMate`. If your existing data is still stored under the old database name, either migrate it to `CraveMate` or temporarily set `DB_NAME` to the old database name in the relevant service `.env` files.

## Security note for a real deployment

This is a strong portfolio/demo architecture, but production handling of identity documents requires additional compliance work. Do not collect real Aadhaar/government-ID data in a public deployment without appropriate encryption, access controls, retention policy, consent, and legal/compliance review.

## Validation performed for this upgrade

- Parsed/transpiled every `.ts` and `.tsx` source file with the TypeScript compiler API: **passed syntax validation**.
- Searched the source for old Tomato/Zomato branding and removed it from application code.
- Searched for the previously exposed `VITE_INTERNAL_SERVICE_KEY`: removed.
- A normal `npm run build` could not be completed in the upgrade environment because the available npm registry/mirror could not provide required packages (`@eslint/js`, and the fallback public-registry install timed out). Run `npm install` and `npm run build` locally with normal npm access for the final dependency-aware type/build check.

