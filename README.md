# 🍽️ CraveMate

### Full-Stack Food Delivery Platform with Microservices & Real-Time Tracking

[![Live Demo](https://img.shields.io/badge/Live%20Demo-CraveMate-orange?style=for-the-badge&logo=render&logoColor=white)](https://cravemate-client.onrender.com)

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-5-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-Event_Driven-FF6600?style=flat-square&logo=rabbitmq&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=flat-square&logo=socket.io&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-Payments-3395FF?style=flat-square&logo=razorpay&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?style=flat-square&logo=cloudinary&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat-square&logo=docker&logoColor=white)
![Render](https://img.shields.io/badge/Render-Deployed-46E3B7?style=flat-square&logo=render&logoColor=black)

---

## 📌 About

**CraveMate** is a full-stack food delivery platform built using a **microservice-based architecture**.

It supports the complete food delivery lifecycle:

**Customer → Restaurant → Payment → Order Processing → Rider Assignment → Real-Time Delivery Tracking**

The system uses **REST APIs** for synchronous communication, **RabbitMQ** for asynchronous event-driven workflows, and **Socket.IO** for real-time updates and rider tracking.

---

## ✨ Features

### 👤 Customer
- Google OAuth and Email/Password authentication
- Restaurant discovery based on location
- Restaurant search
- Menu browsing
- Cart management
- Saved delivery addresses
- Razorpay payments
- Order history
- Real-time order status
- Live rider location tracking

### 🏪 Restaurant
- Restaurant registration
- Admin verification
- Restaurant profile management
- Menu management
- Open/close restaurant
- Incoming order management
- Order status updates
- Real-time new order notifications

### 🛵 Rider
- Rider registration and verification
- Online/offline availability
- Nearby delivery request discovery
- Order acceptance
- Pickup and delivery workflow
- Live location sharing
- Current delivery tracking

### 🛡️ Admin
- Restaurant verification
- Rider verification
- Protected admin dashboard
- Marketplace onboarding management

---

# 🏗️ Architecture

CraveMate follows a **microservices architecture** where each backend service has a specific responsibility and can be deployed independently.

```mermaid
flowchart TB

    USER["Customer / Seller / Rider / Admin"]

    FRONTEND["React + TypeScript + Vite"]

    subgraph SERVICES["Backend Microservices"]
        AUTH["Auth Service"]
        REST["Restaurant Service"]
        RIDER["Rider Service"]
        UTILS["Utils / Payment Service"]
        REALTIME["Realtime Service"]
        ADMIN["Admin Service"]
    end

    subgraph INFRA["Infrastructure"]
        DB[("MongoDB Atlas")]
        MQ[("RabbitMQ")]
    end

    subgraph EXTERNAL["External Services"]
        GOOGLE["Google OAuth"]
        RAZORPAY["Razorpay"]
        CLOUDINARY["Cloudinary"]
        MAP["OpenStreetMap / OSRM"]
    end

    USER --> FRONTEND

    FRONTEND --> AUTH
    FRONTEND --> REST
    FRONTEND --> RIDER
    FRONTEND --> UTILS
    FRONTEND --> ADMIN

    FRONTEND <-->|WebSocket| REALTIME

    AUTH --> DB
    AUTH --> GOOGLE

    REST --> DB
    REST <--> MQ
    REST --> REALTIME
    REST --> UTILS

    RIDER --> DB
    RIDER <--> MQ
    RIDER --> REST
    RIDER --> REALTIME

    ADMIN --> DB

    UTILS --> RAZORPAY
    UTILS --> CLOUDINARY
    UTILS <--> MQ

    FRONTEND --> MAP
```

---

## 🔄 Order Flow

```mermaid
sequenceDiagram

    actor Customer
    participant FE as Frontend
    participant RS as Restaurant Service
    participant DB as MongoDB
    participant US as Utils Service
    participant RP as Razorpay
    participant MQ as RabbitMQ
    participant RT as Realtime Service
    participant Seller as Restaurant

    Customer->>FE: Add items to cart
    FE->>RS: Create order
    RS->>DB: Validate cart & calculate total
    RS->>DB: Create pending order

    FE->>US: Create Razorpay payment
    US->>RS: Request trusted order amount
    RS-->>US: Return verified amount

    US->>RP: Create payment
    RP-->>Customer: Payment checkout

    Customer->>RP: Complete payment

    FE->>US: Verify payment
    US->>RP: Verify signature/payment
    RP-->>US: Payment confirmed

    US->>MQ: PAYMENT_SUCCESS
    MQ->>RS: Payment event

    RS->>DB: Mark order as paid
    RS->>DB: Clear cart
    RS->>RT: Emit new order
    RT-->>Seller: New order notification
```

---

## 🛵 Rider Dispatch Flow

```mermaid
flowchart LR

    REST["Restaurant Service"]
    MQ[("RabbitMQ")]
    RIDER["Rider Service"]
    DB[("MongoDB")]
    RT["Realtime Service"]
    CLIENT["Rider Client"]

    REST -->|"ORDER_READY_FOR_RIDER"| MQ

    MQ --> RIDER

    RIDER -->|"Geospatial Query"| DB

    DB -->|"Nearby verified riders"| RIDER

    RIDER --> RT

    RT -->|"order:available"| CLIENT

    CLIENT -->|"Accept Order"| RIDER
```

---

# ⚡ Real-Time Tracking

Socket.IO is used for:

- New order notifications
- Order status updates
- Rider assignment
- Delivery requests
- Rider location updates

```text
Rider Device
     ↓
Rider Service
     ↓
Realtime Service
     ↓
Socket.IO
     ↓
Customer
```

---

# 💳 Payment Flow

CraveMate currently uses **Razorpay** for online payments.

```text
Customer
    ↓
Frontend
    ↓
Restaurant Service
    ↓
Utils / Payment Service
    ↓
Razorpay
    ↓
Payment Verification
    ↓
RabbitMQ
    ↓
Restaurant Service
    ↓
Order marked as PAID
```

Payment amount is calculated and verified on the backend rather than trusting the frontend.

---

# 📍 Location-Based Features

CraveMate uses MongoDB geospatial functionality for location-aware operations.

### Restaurant Discovery

Customers can discover nearby restaurants using:

- GeoJSON coordinates
- `2dsphere` indexes
- MongoDB geospatial queries

### Rider Discovery

When an order is ready, the Rider service searches for:

```text
Verified
+
Available
+
Nearby
```

delivery partners.

---

# 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend UI |
| TypeScript | Type safety and maintainability |
| Vite | Frontend build tool |
| Tailwind CSS | UI styling |
| Node.js | Backend runtime |
| Express.js | REST APIs |
| MongoDB Atlas | Primary database |
| Mongoose | MongoDB ODM |
| RabbitMQ | Event-driven communication |
| Socket.IO | Real-time communication |
| JWT | Authentication & authorization |
| Google OAuth | Social authentication |
| bcrypt | Password hashing |
| Razorpay | Online payments |
| Cloudinary | Image storage |
| Leaflet / OpenStreetMap | Maps & location visualization |
| OSRM | Route calculation |
| Docker | Containerization |
| Render | Deployment |

---

# 📂 Project Structure

```text
CraveMate/
│
├── frontend/
│
├── services/
│   ├── auth/
│   ├── restaurant/
│   ├── utils/
│   ├── realtime/
│   ├── rider/
│   └── admin/
│
├── README.md
└── .gitignore
```

---

# 🔐 Security

CraveMate implements:

- JWT authentication
- Google OAuth
- bcrypt password hashing
- Role-based authorization
- Protected admin/seller/rider routes
- Server-side payment verification
- Internal service authentication
- Restaurant ownership validation
- Rider authorization
- Server-side order state validation
- Environment-based secret management

Sensitive credentials such as:

```text
MongoDB credentials
Razorpay secrets
Google client secret
Cloudinary secret
JWT secret
Internal service key
```

are kept in environment variables and are not exposed to the frontend.

---

# 🚀 Local Setup

## 1. Clone

```bash
git clone https://github.com/<your-username>/CraveMate.git
cd CraveMate
```

## 2. Install dependencies

```bash
cd frontend
npm install
```

Install dependencies for each backend service:

```bash
cd services/auth
npm install

cd ../restaurant
npm install

cd ../utils
npm install

cd ../realtime
npm install

cd ../rider
npm install

cd ../admin
npm install
```

## 3. Configure Environment Variables

Create `.env` files using the provided `.env.example` files.

Required infrastructure:

- MongoDB Atlas
- RabbitMQ / CloudAMQP
- Google OAuth credentials
- Razorpay credentials
- Cloudinary credentials

## 4. Start Services

Run each service in a separate terminal.

```bash
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

---

# 🌐 Live Demo

### [🚀 Open CraveMate](https://cravemate-client.onrender.com)

> Free Render services may take some time to wake up after inactivity.

---

# 🎯 Key Engineering Highlights

- Microservice-based backend architecture
- Event-driven communication using RabbitMQ
- Real-time communication with Socket.IO
- Location-based restaurant and rider discovery
- MongoDB geospatial queries
- Atomic rider assignment workflow
- Secure Razorpay payment verification
- JWT + Google OAuth + Email/Password authentication
- Cloudinary-based image management
- Dockerized backend services
- Independently deployable services

---

# 🔮 Future Improvements

- Redis caching
- Payment webhooks
- Notification service
- Coupon and discount system
- Ratings and reviews
- Advanced admin analytics
- Dead-letter queues and retry mechanisms
- Centralized logging
- Automated testing
- CI/CD pipeline
- Redis adapter for horizontally scaled Socket.IO

---

<div align="center">

### 🍽️ CraveMate

**Your cravings. Delivered.**

[🌐 Live Demo](https://cravemate-client.onrender.com)

</div>
