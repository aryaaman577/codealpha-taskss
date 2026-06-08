# SyncSpace

**A premium unified workspace for real-time collaboration.**

Built by **Aman Gupta** — [CodeAlpha](https://www.codealpha.tech/) Task 4.

---

## Overview

SyncSpace brings meetings, chat, whiteboard, and file sharing into one calm, beautiful space for your entire team. It features real-time communication powered by Socket.io and WebRTC, secure cookie-based authentication with email OTP verification, and a polished premium UI.

---

## Tech Stack

| Layer        | Technology                                                    |
| ------------ | ------------------------------------------------------------- |
| Frontend     | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion |
| Backend      | Node.js, Express, TypeScript                                  |
| Database     | MongoDB (Mongoose ODM)                                        |
| Realtime     | Socket.io, WebRTC (peer-to-peer)                              |
| Auth         | JWT (HttpOnly cookies), bcrypt, Zod validation                |
| Email        | Resend (transactional OTP emails)                              |
| File Storage | Cloudinary (optional)                                          |
| Monorepo     | npm workspaces, Turborepo                                      |

---

## Core Features

- **Authentication** — Register, login, email OTP verification, forgot/reset password
- **Meetings** — Create/join video meetings with WebRTC, screen sharing, hand raise
- **Chat** — Real-time direct and group messaging with typing indicators
- **Whiteboard** — Collaborative drawing canvas with real-time sync
- **Files** — Upload and manage shared files
- **Notifications** — Real-time notification system
- **Profile & Settings** — User profile management, avatar upload, custom status
- **Dashboard** — Central hub with meeting and chat quick access
- **Premium Landing Page** — Animated hero, feature showcase, pricing, and CTA sections

---

## Monorepo Structure

```
syncspace/
├── apps/
│   ├── web/                # Next.js 14 frontend
│   │   ├── app/            # App Router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # Axios, Socket.io clients
│   │   ├── stores/         # Zustand state management
│   │   └── middleware.ts   # Auth route protection
│   └── server/             # Express + Socket.io backend
│       └── src/
│           ├── config/     # Environment, database config
│           ├── controllers/# Route handlers
│           ├── middleware/ # Auth, rate limiting, error handling
│           ├── models/     # Mongoose schemas
│           ├── routes/     # API route definitions
│           ├── services/   # Email, socket, token services
│           ├── utils/      # Helpers (OTP, errors, responses)
│           └── validators/ # Zod request validators
├── packages/
│   └── shared/             # Shared TypeScript types
├── .env.example            # Environment template (safe to commit)
├── turbo.json              # Turborepo pipeline config
└── package.json            # Root workspace config
```

---

## Prerequisites

- **Node.js** ≥ 20.0.0
- **npm** ≥ 10.x
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Resend API key** — optional for dev (OTP logs to console), required for production

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/aryaaman577/codealpha-project.git
cd codealpha-project
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your real values:

| Variable               | Description                                   |
| ---------------------- | --------------------------------------------- |
| `MONGODB_URI`          | MongoDB connection string                     |
| `JWT_ACCESS_SECRET`    | Random secret for access tokens (min 10 chars)|
| `JWT_REFRESH_SECRET`   | Random secret for refresh tokens (min 10 chars)|
| `RESEND_API_KEY`       | Resend.com API key (optional in dev)          |
| `CLOUDINARY_*`         | Cloudinary credentials (optional)             |
| `TURN_*`               | TURN server credentials (production WebRTC)   |

> **⚠️ Never commit your `.env` file. Only `.env.example` should be in Git.**

### 4. Start MongoDB

If running locally:

```bash
mongod
```

Or configure `MONGODB_URI` to point to your Atlas cluster.

---

## Development

### Start all services (frontend + backend)

```bash
npm run dev
```

This starts:
- **Frontend** → [http://localhost:3000](http://localhost:3000)
- **Backend API** → [http://localhost:5000](http://localhost:5000)
- **Health Check** → [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Individual commands

```bash
# Type-check all packages
npm run type-check

# Build all packages for production
npm run build

# Lint all packages
npm run lint

# Format code with Prettier
npm run format

# Clean build artifacts
npm run clean
```

### Start production server (backend only)

```bash
cd apps/server
npm run build
npm start
```

### Start production frontend (after build)

```bash
cd apps/web
npm run build
npm start
```

---

## Email OTP in Development

If `RESEND_API_KEY` is not configured, the server will:
- Log a warning: `⚠️ Email provider is not configured`
- Print OTP codes to the **server console** in development mode only
- In production, email delivery will fail silently — configure Resend before deploying

---

## Deployment Guide

### Frontend (Vercel — recommended)

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set the root directory to `apps/web`
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL` → your production backend URL + `/api`
   - `NEXT_PUBLIC_SOCKET_URL` → your production backend URL
   - `NEXT_PUBLIC_APP_URL` → your Vercel domain
4. Deploy

### Backend (Render / Railway / Fly.io)

1. Set the root directory to `apps/server`
2. Build command: `npm run build`
3. Start command: `npm start` (runs `node dist/server.js`)
4. Set all server environment variables (see `apps/server/.env.example`)
5. Ensure the host supports **WebSocket connections** (required for Socket.io)
6. Health check endpoint: `GET /api/health` — returns server status, DB connection, memory, and uptime
7. `CLIENT_URL` must exactly match your frontend domain for CORS
8. Socket.io uses `credentials: true` — the frontend origin must be in the allowed CORS list

### Database (MongoDB Atlas)

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a **database user** with read/write permissions
3. Go to **Network Access** → add your backend server's IP to the allowlist
4. Get the connection string (replace `<password>` with your database user password)
5. Set the full connection string as `MONGODB_URI` in your backend environment

### Email (Resend)

1. Sign up at [Resend](https://resend.com)
2. Verify your sending domain
3. Create an API key and set it as `RESEND_API_KEY`
4. Update `EMAIL_FROM` with your verified domain

> **Note:** OTP codes are never exposed in API responses. They are hashed before storage and only sent via email. In development without Resend configured, OTPs are logged to the server terminal only.

---

## Production Configuration

### Cookie & CORS Settings

For production deployment, update these environment variables:

```env
NODE_ENV=production
COOKIE_DOMAIN=.yourdomain.com
COOKIE_SECURE=true
CLIENT_URL=https://your-frontend-domain.com
```

Key requirements:
- `COOKIE_SECURE=true` — cookies sent only over HTTPS
- `COOKIE_DOMAIN` — must match your frontend domain (use `.yourdomain.com` for subdomains)
- `CLIENT_URL` — must exactly match the frontend origin for CORS
- Cookies use `httpOnly: true` and `sameSite: strict` by default

### WebRTC / TURN Server

For reliable video calls behind NATs and firewalls, configure a TURN server:

```env
TURN_SERVER_URL=turn:your-turn-server.example.com:3478
TURN_USERNAME=your_turn_username
TURN_CREDENTIAL=your_turn_credential
```

Free TURN options: [Metered TURN](https://www.metered.ca/tools/openrelay/), [Coturn](https://github.com/coturn/coturn) (self-hosted).

---

## Security Notes

- **HttpOnly cookie auth** — JWTs are stored in HttpOnly cookies, never in localStorage or sessionStorage
- **No token in URLs** — tokens are never passed as query parameters
- **OTP hashing** — email verification and password reset OTPs are hashed (bcrypt) before storage
- **Rate limiting** — auth endpoints, file uploads, and email sends have separate rate limiters
- **Input validation** — all request bodies validated with Zod schemas
- **Helmet + CORS** — security headers and strict CORS origin checking
- **MongoDB sanitization** — query injection prevention via express-mongo-sanitize
- **HPP protection** — HTTP parameter pollution prevention
- **Dev OTP logging** — OTP codes only log to console when `NODE_ENV=development` and email provider is missing

---

## Troubleshooting

| Issue                              | Solution                                                       |
| ---------------------------------- | -------------------------------------------------------------- |
| `MONGODB_URI is required`          | Create `.env` from `.env.example` and set your MongoDB URI     |
| `JWT_ACCESS_SECRET must be ≥10`    | Set a strong random secret in `.env`                           |
| OTP not received via email         | Check `RESEND_API_KEY`; in dev, OTP prints to server console   |
| CORS errors in browser             | Ensure `CLIENT_URL` matches your frontend origin exactly       |
| Cookies not sent                   | Check `COOKIE_DOMAIN`, `COOKIE_SECURE`, and `withCredentials`  |
| WebRTC calls fail on network       | Configure a TURN server for production                         |
| `Duplicate schema index` warning   | Safe to ignore — Mongoose duplicate index declarations         |
| Type-check fails                   | Run `npm run type-check -- --force` from root                  |
| Build fails                        | Run `npm run build` from root; check for TS errors first       |

---

## GitHub Submission

**Repository:** [github.com/aryaaman577/codealpha-project](https://github.com/aryaaman577/codealpha-project)

**Submitted for:** CodeAlpha Task 4

---

## License

This project was built as part of the CodeAlpha internship program.

---

> **⚠️ Important:** Never commit `.env` files containing real credentials. Only `.env.example` files with placeholder values should be checked into version control.
