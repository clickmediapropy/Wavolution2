# Tech Stack Migration Design: Flask → Vite+ React + Convex

**Date:** 2026-03-23
**Status:** Draft
**Scope:** Full rewrite of Message Hub (wavolution2) from Flask/SQLite/Jinja2 to Vite+/React/Convex with VPS-hosted campaign worker

---

## Context

Message Hub is a WhatsApp bulk messaging platform built on Flask + SQLite + Jinja2 templates with Evolution API integration. The app is not live — this is a greenfield rewrite using the existing codebase as a feature spec.

### Current Stack
- **Backend:** Flask (Python), SQLite, raw SQL via `DatabaseManager`
- **Frontend:** Jinja2 templates, Bootstrap 5 + Tailwind CSS (CDN)
- **WhatsApp:** Evolution API (HTTP REST)
- **Auth:** PBKDF2 password hashing, Flask sessions
- **Campaign worker:** In-memory Python `queue.Queue` + background `threading.Thread`

### Target Stack
- **Frontend:** Vite+ (`vp` CLI) + React + Tailwind CSS + shadcn/ui, hosted on Vercel
- **Database:** Convex Cloud (real-time reactive database)
- **Auth:** Custom username/password (no email verification)
- **VPS:** Evolution API (already running at `wavolution.agentifycrm.io`) + Node.js campaign worker
- **Language:** TypeScript everywhere

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Vite+ (vp) + React (SPA)                            │    │
│  │  - vp dev / vp build / vp test / vp check             │    │
│  │  - Tailwind CSS + shadcn/ui                           │    │
│  │  - Convex React client (useQuery, useMutation)        │    │
│  │  - Custom auth (username/password)                    │    │
│  │  - React Router for page navigation                   │    │
│  └──────────────────────┬──────────────────────────────┘    │
└─────────────────────────┼───────────────────────────────────┘
                          │ WebSocket (real-time sync)
┌─────────────────────────┼───────────────────────────────────┐
│                    CONVEX CLOUD                              │
│  ┌──────────────────────┴──────────────────────────────┐    │
│  │  Tables: users, contacts, messages, campaigns         │    │
│  │  Queries: list contacts, dashboard stats, campaign    │    │
│  │           progress (real-time via subscriptions)       │    │
│  │  Mutations: CRUD contacts, import CSV, start/stop     │    │
│  │            campaign, register/login                    │    │
│  │  Actions: call VPS API (trigger campaign, check       │    │
│  │          connection, get QR code)                      │    │
│  └──────────────────────┬──────────────────────────────┘    │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP (Convex action → VPS API)
┌─────────────────────────┼───────────────────────────────────┐
│                       VPS (contabo)                          │
│  ┌──────────────────────┴──────────────────────────────┐    │
│  │  Evolution API (atendai/evolution-api:latest)         │    │
│  │  - Domain: wavolution.agentifycrm.io                  │    │
│  │  - Port: 8080, PostgreSQL 16, Redis 7                 │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │  Campaign Worker (Node.js/TypeScript)                 │    │
│  │  - Express API for VPS endpoints                      │    │
│  │  - Convex Node.js client to read/write campaign data  │    │
│  │  - Message queue processor with configurable delays   │    │
│  │  - Calls Evolution API on localhost:8080               │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Key Communication Pattern
- **React never calls the VPS directly.** All communication flows through Convex.
- **Convex actions** make HTTP calls to the VPS worker API for Evolution API operations.
- **VPS worker** uses the Convex Node.js client to read campaign data and write progress updates.
- **React UI** subscribes to Convex queries for real-time updates (no polling).

---

## Convex Data Model

### `users` table

| Field | Type | Notes |
|-------|------|-------|
| `username` | `string` | Unique, used for login |
| `passwordHash` | `string` | bcrypt hash |
| `name` | `string` | Display name |
| `evolutionInstanceName` | `string` (optional) | Unique per user |
| `evolutionApiKey` | `string` (optional) | Per-instance key |
| `whatsappConnected` | `boolean` | Default `false` |
| `whatsappNumber` | `string` (optional) | |
| `connectionStatus` | `string` | `"disconnected"` / `"connecting"` / `"open"` |
| `instanceCreated` | `boolean` | Default `false` |

Indexes: `by_username` on `["username"]`

### `contacts` table

| Field | Type | Notes |
|-------|------|-------|
| `userId` | `Id<"users">` | Foreign key |
| `phone` | `string` | |
| `name` | `string` (optional) | |
| `status` | `string` | `"pending"` / `"sent"` / `"failed"` |
| `sentAt` | `number` (optional) | Timestamp |

Indexes: `by_user` on `["userId"]`, `by_user_phone` on `["userId", "phone"]`

### `messages` table

| Field | Type | Notes |
|-------|------|-------|
| `userId` | `Id<"users">` | Foreign key |
| `phone` | `string` | |
| `message` | `string` | |
| `status` | `string` | `"sent"` / `"failed"` |

Indexes: `by_user` on `["userId"]`

### `campaigns` table

| Field | Type | Notes |
|-------|------|-------|
| `userId` | `Id<"users">` | Foreign key |
| `status` | `string` | `"pending"` / `"running"` / `"completed"` / `"stopped"` |
| `total` | `number` | Total contacts |
| `processed` | `number` | Processed so far |
| `sent` | `number` | Successfully sent |
| `failed` | `number` | Failed sends |
| `delay` | `number` | Seconds between messages |
| `messageTemplate` | `string` | Template with `{name}`, `{phone}` placeholders |
| `hasMedia` | `boolean` | |

Indexes: `by_user` on `["userId"]`

### `sessions` table

| Field | Type | Notes |
|-------|------|-------|
| `userId` | `Id<"users">` | Foreign key |
| `token` | `string` | Session token |
| `expiresAt` | `number` | Timestamp |

Indexes: `by_token` on `["token"]`

### Notes
- Convex auto-generates `_id` (unique ID) and `_creationTime` (timestamp) on every document.
- No `password_reset_tokens` table needed (no email-based password reset).
- Campaigns are now **persisted** — survives restarts, enables resume after crashes.

---

## React Frontend

### Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `LoginPage` | Username/password login (redirects to dashboard if authenticated) |
| `/register` | `RegisterPage` | Username/password registration |
| `/landing` | `LandingPage` | Public marketing page |
| `/dashboard` | `DashboardPage` | Stats, connection status, recent messages, quick actions |
| `/contacts` | `ContactsPage` | Paginated contact list with search, add/edit/delete |
| `/contacts/upload` | `UploadContactsPage` | CSV upload form |
| `/send` | `SendMessagePage` | Single message + media send |
| `/campaigns` | `BulkCampaignPage` | Bulk send with contact selection, progress tracking |
| `/campaigns/:id/status` | `CampaignStatusPage` | Real-time campaign progress |
| `/setup` | `SetupWhatsAppPage` | Evolution API instance creation |
| `/connect` | `ConnectWhatsAppPage` | QR code scanning |

### Shared Components

| Component | Purpose |
|-----------|---------|
| `AppLayout` | Navbar, flash messages, footer (replaces `base_simple.html`) |
| `Navbar` | Top nav with user dropdown (shadcn `DropdownMenu`) |
| `ProtectedRoute` | Auth guard — redirects to login if not authenticated |
| `WhatsAppGuard` | Redirects to setup/connect if WhatsApp not configured |
| `StatsCard` | Dashboard stat cards (shadcn `Card`) |
| `ContactTable` | Paginated table with search (shadcn `Table` + `Input`) |
| `CampaignProgress` | Real-time progress bar + stats (Convex subscription) |
| `MediaUpload` | File upload with preview + validation |
| `FlashMessage` | Toast notifications (shadcn `Sonner`) |

### Auth Flow
1. `LoginPage` calls Convex mutation `login({ username, password })` → returns session token
2. Token stored in localStorage, sent with every Convex request
3. `ProtectedRoute` checks auth state via `useQuery` — if no valid session, redirects to `/`
4. `WhatsAppGuard` checks user's `instanceCreated` and `whatsappConnected` fields
5. Logout clears token and deletes session from Convex

### Styling
- **Tailwind CSS** installed via PostCSS (not CDN)
- **shadcn/ui** for pre-built accessible components
- Same visual design as current app (blue/purple accent, white cards, glass navbar)
- Font Awesome for icons (same as current)

---

## VPS Campaign Worker

### Overview
Node.js/TypeScript Express server running as a Docker container on the VPS alongside Evolution API. Secured by a shared secret.

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/campaigns/start` | Start processing a campaign |
| `POST` | `/campaigns/stop` | Stop a running campaign |
| `POST` | `/evolution/create-instance` | Create Evolution API instance for a new user |
| `GET` | `/evolution/qr/:instanceName` | Get QR code for WhatsApp connection |
| `GET` | `/evolution/status/:instanceName` | Check connection status |
| `POST` | `/evolution/send-text/:instanceName` | Send single text message |
| `POST` | `/evolution/send-media/:instanceName` | Send single media message |
| `DELETE` | `/evolution/instance/:instanceName` | Delete an instance |
| `GET` | `/health` | Health check |

### Security
- `VPS_API_SECRET` env var shared between Convex and VPS worker
- Every request validated via `Authorization: Bearer <secret>` header
- VPS API not called directly by React — only by Convex actions

### Campaign Processing

```
1. Convex action → POST /campaigns/start { campaignId }
2. Worker reads campaign + contacts from Convex via Node.js client
3. For each contact:
   a. Personalize message template ({name}, {phone})
   b. POST to Evolution API at localhost:8080/message/sendText/{instance}
   c. If media: POST to localhost:8080/message/sendMedia/{instance}
   d. Write message record to Convex via mutation
   e. Update campaign progress in Convex (processed++, sent++ or failed++)
   f. Sleep for configured delay (default 2 seconds)
4. On completion: update campaign status to "completed" in Convex
5. If stopped: exit loop, update campaign status to "stopped"
```

### Deployment
- Docker container added to existing `docker-compose.yml` on VPS
- Shares network with Evolution API container (access via `localhost:8080` or container name)
- Environment variables: `CONVEX_URL`, `CONVEX_DEPLOY_KEY`, `VPS_API_SECRET`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`

---

## Feature Parity Checklist

Every feature from the Flask app must be present in the new stack:

- [ ] User registration (username/password → create Evolution instance)
- [ ] User login/logout (session-based)
- [ ] WhatsApp setup (create Evolution API instance)
- [ ] WhatsApp connection (QR code display + status polling)
- [ ] Dashboard (stats: total contacts, messages sent, today's messages, connection status)
- [ ] Contact list (paginated, searchable, with sent/pending status)
- [ ] Add single contact
- [ ] Edit contact
- [ ] Delete contact(s)
- [ ] CSV contact import
- [ ] Send single message (text + optional media)
- [ ] Send single message with multiple media files
- [ ] Bulk campaign (select all/pending/selected contacts)
- [ ] Campaign message personalization ({name}, {phone})
- [ ] Campaign media attachments
- [ ] Campaign progress tracking (real-time)
- [ ] Campaign stop functionality
- [ ] Recent messages display on dashboard
- [ ] Rate limiting on API endpoints
- [ ] Media file validation (type, size)
- [ ] Flash message / toast notifications
- [ ] Responsive layout

---

## What's NOT Being Migrated

- Email-based password reset (removed by design)
- Email service (SMTP integration)
- Flask rate limiter (will use Convex-side rate limiting or skip)
- `references/evolution-api` directory (reference code, not part of the app)
- `migrate.py` (no longer needed — Convex handles schema)
- Security headers middleware (Vercel handles these via config)

---

## Project Structure

```
wavolution2/
├── src/                          # React frontend
│   ├── components/               # Shared components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── AppLayout.tsx
│   │   ├── Navbar.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── WhatsAppGuard.tsx
│   │   ├── StatsCard.tsx
│   │   ├── ContactTable.tsx
│   │   ├── CampaignProgress.tsx
│   │   └── MediaUpload.tsx
│   ├── pages/                    # Page components
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── LandingPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ContactsPage.tsx
│   │   ├── UploadContactsPage.tsx
│   │   ├── SendMessagePage.tsx
│   │   ├── BulkCampaignPage.tsx
│   │   ├── CampaignStatusPage.tsx
│   │   ├── SetupWhatsAppPage.tsx
│   │   └── ConnectWhatsAppPage.tsx
│   ├── lib/                      # Utilities
│   │   └── auth.ts               # Auth helpers (token management)
│   ├── App.tsx                   # Router setup
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Tailwind imports
├── convex/                       # Convex backend
│   ├── schema.ts                 # Table definitions
│   ├── auth.ts                   # Login/register/logout mutations
│   ├── users.ts                  # User queries and mutations
│   ├── contacts.ts               # Contact CRUD queries/mutations
│   ├── campaigns.ts              # Campaign queries/mutations
│   ├── messages.ts               # Message queries
│   ├── evolution.ts              # Actions that call VPS API
│   └── _generated/               # Auto-generated Convex types
├── worker/                       # VPS campaign worker (separate deploy)
│   ├── src/
│   │   ├── index.ts              # Express server entry
│   │   ├── routes/
│   │   │   ├── campaigns.ts      # Campaign start/stop endpoints
│   │   │   └── evolution.ts      # Evolution API proxy endpoints
│   │   ├── services/
│   │   │   ├── campaignProcessor.ts  # Queue-based message sender
│   │   │   └── evolutionApi.ts       # Evolution API HTTP client
│   │   └── convex.ts             # Convex client setup
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── vite.config.ts                # Vite+ config
├── tailwind.config.ts
├── package.json
├── tsconfig.json
└── vercel.json                   # Vercel deployment config
```
