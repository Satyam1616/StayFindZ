# 🏠 StayFinder

> **Short & Long-Term Property Rental Platform**
> Discover unique homes, experiences, and places around India.

[![Node.js](https://img.shields.io/badge/Node.js-20_LTS-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://www.prisma.io/)

---

## 📋 Overview

StayFinder is a full-stack web application enabling guests to discover and book properties for short-term or long-term stays, and empowering hosts to list and manage their properties.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite |
| **Styling** | Vanilla CSS (Design System) |
| **State** | React Context + React Query |
| **Backend** | Node.js + Express.js |
| **Database** | PostgreSQL 16 + Prisma ORM |
| **Auth** | JWT (access + refresh tokens) |
| **Validation** | Zod (server + client) |
| **Animation** | Framer Motion |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** 16 (via Docker or local install)
- **npm** or **yarn**

### 1. Clone & Install

```bash
git clone <repo-url>
cd StayFindz

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Database Setup

**Option A: Docker Compose** (Recommended)

```bash
# From project root
docker-compose up -d
```

**Option B: Local PostgreSQL**

Create a database named `stayfinder` and update `server/.env` with your connection string.

### 3. Environment Variables

```bash
# Copy the example and update values
cp server/.env.example server/.env
```

### 4. Run Migrations & Seed

```bash
cd server
npx prisma migrate dev --name init
npm run db:seed
```

### 5. Start Development

```bash
# Terminal 1 — Backend (port 5000)
cd server
npm run dev

# Terminal 2 — Frontend (port 5173)
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Guest | `aarav@guest.com` | `Test@1234` |
| Guest | `priya@guest.com` | `Test@1234` |
| Host | `meera@host.com` | `Test@1234` |
| Host | `vikram@host.com` | `Test@1234` |
| Admin | `admin@stayfinder.com` | `Test@1234` |

---

## 📁 Project Structure

```
StayFindz/
├── client/                   # React + Vite frontend
│   ├── src/
│   │   ├── api/              # Axios API client + endpoint functions
│   │   ├── components/       # Navbar, Footer, PropertyCard
│   │   ├── context/          # AuthContext provider
│   │   ├── pages/            # HomePage, LoginPage, DashboardPage, etc.
│   │   ├── App.jsx           # Routes + providers
│   │   └── index.css         # Global design system
│   └── index.html
├── server/                   # Express API server
│   ├── controllers/          # Auth, Listings, Bookings, Reviews
│   ├── middleware/           # Auth, Validation, Error handling
│   ├── routes/               # Route definitions
│   ├── prisma/               # Schema + seed script
│   ├── utils/                # JWT tokens, Zod schemas
│   └── index.js              # Server entry point
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Endpoints

### Auth (`/api/v1/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Register new user |
| POST | `/login` | — | Login, get tokens |
| POST | `/logout` | Bearer | Invalidate session |
| POST | `/refresh` | Cookie | Rotate tokens |
| GET | `/me` | Bearer | Get profile |
| PATCH | `/me` | Bearer | Update profile |

### Listings (`/api/v1/listings`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | — | Paginated + filtered list |
| GET | `/:id` | — | Full detail with reviews |
| POST | `/` | Host | Create listing |
| PATCH | `/:id` | Owner | Update listing |
| DELETE | `/:id` | Owner | Soft delete |
| GET | `/:id/availability` | — | Booked date ranges |

### Bookings (`/api/v1/bookings`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Guest | Create booking |
| GET | `/:id` | Owner | Booking detail |
| PATCH | `/:id/cancel` | Guest | Cancel booking |
| GET | `/me` | Bearer | My bookings |
| GET | `/hosting/me` | Host | Host's incoming bookings |

---

## 🎨 Design Tokens

| Token | Value |
|-------|-------|
| Primary | `#FF5A5F` (Coral) |
| Accent | `#00A699` (Teal) |
| Font | DM Sans |
| Border Radius | 12px (cards), 8px (inputs) |
| Shadow | `0 2px 16px rgba(0,0,0,0.12)` |

---

## 📄 License

MIT
