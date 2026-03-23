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
- **Auth:** Convex Auth with Password provider (email/password, managed sessions)
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
│  │  - Convex Auth (email/password via Password provider)  │    │
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

### Authentication: Convex Auth with Password provider

Auth is handled by `@convex-dev/auth` with the built-in `Password` provider. This eliminates custom session management, password hashing, and token storage. All functions use `ctx.auth.getUserIdentity()` to get the authenticated user. No `sessionToken` argument needed on any function.

Setup: `convex/auth.config.ts` configures the Password provider. `convex/auth.ts` exports `{ auth, signIn, signOut, store }`. React wraps the app in `<ConvexAuthProvider>`.

### `users` table

Convex Auth automatically creates its own auth tables. The `users` table extends the auth user with app-specific fields:

| Field | Type | Notes |
|-------|------|-------|
| `name` | `string` | Display name |
| `evolutionInstanceName` | `string` (optional) | Unique per user |
| `evolutionApiKey` | `string` (optional) | Per-instance key |
| `whatsappConnected` | `boolean` | Default `false` |
| `whatsappNumber` | `string` (optional) | |
| `connectionStatus` | `string` | `"disconnected"` / `"connecting"` / `"open"` |
| `instanceCreated` | `boolean` | Default `false` |

Indexes: none needed (Convex Auth manages user lookup by identity)

### `contacts` table

| Field | Type | Notes |
|-------|------|-------|
| `userId` | `Id<"users">` | Foreign key |
| `phone` | `string` | |
| `name` | `string` (optional) | |
| `status` | `string` | `"pending"` / `"sent"` / `"failed"` |
| `sentAt` | `number` (optional) | Timestamp |

Indexes: `by_user` on `["userId"]`, `by_user_phone` on `["userId", "phone"]`

Search index: `search_by_name` with `searchField: "name"`, `filterFields: ["userId"]`. Convex supports only one `searchField` per index, so phone search uses the `by_user_phone` index with prefix matching. For combined search, add a synthetic `searchText` field (concatenated name + phone) if needed later.

### `messages` table

| Field | Type | Notes |
|-------|------|-------|
| `userId` | `Id<"users">` | Foreign key |
| `campaignId` | `Id<"campaigns">` (optional) | Link to campaign (null for single sends) |
| `phone` | `string` | |
| `message` | `string` | |
| `status` | `string` | `"sent"` / `"failed"` |

Indexes: `by_user` on `["userId"]`, `by_campaign` on `["campaignId"]`, `by_user_and_phone` on `["userId", "phone"]`

### `campaigns` table

| Field | Type | Notes |
|-------|------|-------|
| `userId` | `Id<"users">` | Foreign key |
| `status` | `string` | `"pending"` / `"running"` / `"completed"` / `"stopped"` |
| `recipientType` | `string` | `"all"` / `"pending"` / `"selected"` — how contacts were chosen |
| `selectedContactIds` | `Id<"contacts">[]` (optional) | Only present when `recipientType === "selected"` |
| `total` | `number` | Total contacts |
| `processed` | `number` | Processed so far |
| `sent` | `number` | Successfully sent |
| `failed` | `number` | Failed sends |
| `delay` | `number` | Seconds between messages |
| `messageTemplate` | `string` | Template with `{name}`, `{phone}` placeholders |
| `hasMedia` | `boolean` | |
| `mediaStorageIds` | `Id<"_storage">[]` (optional) | Convex file storage IDs for campaign media |

Indexes: `by_user` on `["userId"]`

### Media Storage

Campaign media files are stored using **Convex file storage**. Flow:
1. React uploads media via `storage.generateUploadUrl()` → returns `Id<"_storage">`
2. Storage IDs saved on the campaign document in `mediaStorageIds`
3. VPS worker retrieves public URLs via `storage.getUrl(storageId)` → passes URL directly to Evolution API's `media` field (Evolution API accepts URLs natively — no base64 conversion needed)
4. After campaign completes, media files can be cleaned up from Convex storage

This handles the gap between upload time and campaign processing (which may be hours later). Convex file storage supports files up to 256MB, well above the 50MB video limit.

### Notes
- Convex auto-generates `_id` (unique ID) and `_creationTime` (timestamp) on every document.
- **No custom sessions table** — Convex Auth manages sessions, tokens, and password hashing internally via `httpOnly` cookies.
- Campaigns are now **persisted** — survives restarts, enables resume after crashes.
- **`generateUploadUrl` must be auth-protected** — the mutation that generates upload URLs must check `ctx.auth.getUserIdentity()` to prevent unauthenticated uploads.
- **VPS worker should use a service token** (not `CONVEX_DEPLOY_KEY`) to limit blast radius if the VPS is compromised. Use Convex HTTP actions with a shared secret instead.

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
| `*` | `NotFoundPage` | Catch-all 404 page |

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
| `LoadingSpinner` | Loading state for Convex queries (`useQuery` returns `undefined` while loading) |
| `ErrorBoundary` | Error boundary for query/mutation failures |

### Auth Flow (Convex Auth)

Managed by `@convex-dev/auth` — no custom token handling needed.

1. `LoginPage` calls `signIn("password", { email, password })` via the Convex Auth React hooks.
2. `RegisterPage` calls `signIn("password", { email, password, flow: "signUp" })` — the Password provider handles registration.
3. Convex Auth manages sessions via `httpOnly` cookies (more secure than localStorage).
4. All Convex functions call `ctx.auth.getUserIdentity()` to get the authenticated user. No `sessionToken` argument needed.
5. `ProtectedRoute` uses `useConvexAuth()` hook — `isAuthenticated` boolean determines access.
6. `WhatsAppGuard` queries the user document to check `instanceCreated` and `whatsappConnected`.
7. Logout calls `signOut()` from the Convex Auth React hooks.

**Note:** Convex Auth's Password provider uses email as the identifier. If username-only is needed, we'll investigate during implementation — worst case, use email as the login identifier.

### Styling
- **Tailwind CSS** installed via PostCSS (not CDN)
- **shadcn/ui** for pre-built accessible components
- **Lucide React** for icons (shadcn/ui's default icon library — replaces Font Awesome CDN to eliminate third-party script and CSS conflicts)
- Same visual design as current app (blue/purple accent, white cards, glass navbar)

### Convex Integration Notes
- **Pagination:** Use `usePaginatedQuery` with cursor-based pagination (Convex has no OFFSET/LIMIT). The `ContactTable` component uses `loadMore()` pattern.
- **Loading states:** Every `useQuery` returns `undefined` while loading. All pages must handle loading/error/data states.
- **Provider setup:** App root wraps in `ConvexProvider` with `ConvexReactClient`. Auth context wraps inside that.
- **`cn()` utility:** Required by all shadcn/ui components — created by `npx shadcn@latest init` at `src/lib/utils.ts`.

### Vercel Deployment Config

`vercel.json` must include SPA rewrites for client-side routing:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
Without this, direct navigation to any route except `/` will return 404.

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
2. Worker reads campaign from Convex (includes recipientType, selectedContactIds, mediaStorageIds)
3. Worker resolves contacts:
   - recipientType "all" → query all contacts for user
   - recipientType "pending" → query contacts not in messages table
   - recipientType "selected" → query contacts by selectedContactIds
4. If campaign has media: download files from Convex storage URLs → convert to base64
5. For each contact:
   a. Check campaign status in Convex (if "stopped", exit loop)
   b. Personalize message template ({name}, {phone})
   c. POST to Evolution API /message/sendText/{instance}
   d. If media: POST to Evolution API /message/sendMedia/{instance}
   e. Write message record to Convex via mutation
   f. Update campaign progress in Convex (processed++, sent++ or failed++)
   g. Sleep for configured delay (default 2 seconds)
6. On completion: update campaign status to "completed" in Convex
7. On crash recovery: worker checks messages table to skip already-sent contacts
```

### Deployment
- Docker container added to existing `docker-compose.yml` on VPS
- Shares Docker Compose network with Evolution API container — access via Docker service name (e.g., `http://evolution-api:8080`), not `localhost` (unless using `network_mode: host`)
- `EVOLUTION_API_URL` env var handles the correct address regardless of networking mode
- Environment variables: `CONVEX_URL`, `CONVEX_AUTH_TOKEN` (service token, NOT deploy key — limits blast radius), `VPS_API_SECRET`, `EVOLUTION_API_URL` (e.g., `http://evolution-api:8080`), `EVOLUTION_API_KEY`

---

## Feature Parity Checklist

Every feature from the Flask app must be present in the new stack:

- [ ] User registration (email/password via Convex Auth — does NOT create Evolution instance)
- [ ] User login/logout (Convex Auth managed sessions, httpOnly cookies)
- [ ] WhatsApp setup (create Evolution API instance — separate step at `/setup` after registration)
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
│   │   └── utils.ts              # cn() utility for shadcn/ui
│   ├── App.tsx                   # Router setup + ConvexAuthProvider
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Tailwind imports
├── convex/                       # Convex backend
│   ├── schema.ts                 # Table definitions
│   ├── auth.config.ts             # Convex Auth configuration (Password provider)
│   ├── auth.ts                   # Convex Auth exports (auth, signIn, signOut, store)
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
