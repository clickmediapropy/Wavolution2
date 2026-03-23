# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Message Hub (wavolution2) — a WhatsApp bulk messaging platform. Multi-user system with auth, contact management, CSV import, media attachments, and real-time campaign progress tracking.

## Stack

- **Frontend:** Vite 8 + React 19 + TypeScript + Tailwind CSS v4, hosted on Vercel
- **Backend:** Convex Cloud (real-time reactive database + serverless functions)
- **Auth:** Convex Auth with Password provider (email/password)
- **VPS:** Evolution API v2.2.3 + Node.js campaign worker (planned)
- **Testing:** Vitest + React Testing Library (TDD approach)

## Domains

- **App:** `bulk.agentifycrm.io` (Vercel)
- **Evolution API:** `wavolution.agentifycrm.io` (Contabo VPS, port 8080)
- **VPS IP:** `92.118.59.92` (SSH: `ssh contabo`)
- **Convex:** `wandering-blackbird-22` deployment

## Commands

```bash
# Development
npm run dev                      # vp dev (Vite+ dev server)
npx convex dev                   # Convex dev server (watches for changes)

# Build & Check
npm run build                    # vp build (production build)
npm run check                    # vp check (format + lint + type check)

# Tests (TDD)
npm test                         # vitest run (all tests)
npm run test:watch               # vitest watch mode

# Convex
npx convex dev --once            # push schema/functions once
npx convex dashboard             # open Convex dashboard
```

## Architecture

### Communication Pattern
```
React (Vercel) → WebSocket → Convex Cloud → HTTP → VPS (Evolution API)
```
- React never calls the VPS directly. All communication flows through Convex.
- Convex actions make HTTP calls to the VPS worker API.
- React subscribes to Convex queries for real-time updates (no polling).

### Frontend Structure
```
src/
├── App.tsx                    # ConvexAuthProvider + BrowserRouter + Routes
├── main.tsx                   # Entry point
├── components/
│   ├── AppLayout.tsx          # Navbar (auth-aware logout), footer, Sonner toasts
│   ├── ProtectedRoute.tsx     # Auth guard → redirects to / if not authenticated
│   └── AnonymousRoute.tsx     # Inverse guard → redirects to /dashboard if authenticated
├── pages/
│   ├── LoginPage.tsx          # Email/password login
│   ├── RegisterPage.tsx       # Name/email/password registration
│   └── DashboardPage.tsx      # Protected dashboard shell
├── lib/
│   └── utils.ts               # cn() utility (clsx + tailwind-merge)
└── __tests__/                 # Mirrors src/ structure
```

### Convex Backend
```
convex/
├── schema.ts                  # All tables: users (extended), contacts, messages, campaigns + authTables
├── auth.config.ts             # OIDC issuer config (points to Convex site URL)
├── auth.ts                    # Password provider with custom profile callback
├── http.ts                    # HTTP routes for auth OIDC endpoints
└── _generated/                # Auto-generated types (do not edit)
```

### Auth Flow
- `signIn("password", { email, password, flow: "signIn" })` for login
- `signIn("password", { email, password, name, flow: "signUp" })` for registration
- `signOut()` for logout
- `useConvexAuth()` returns `{ isAuthenticated, isLoading }`
- All Convex functions use `ctx.auth.getUserIdentity()` — never accept userId as argument

### Convex Schema Tables
- **users** — auth fields + app fields (evolutionInstanceName, whatsappConnected, etc.)
- **contacts** — userId, phone, name, status, sentAt. Indexes: by_userId, by_userId_and_phone
- **messages** — userId, campaignId, phone, message, status. Indexes: by_userId, by_campaignId
- **campaigns** — userId, status, recipientType, total, processed, sent, failed, delay, messageTemplate, hasMedia, mediaStorageIds

### Testing Pattern
- TDD: write tests first, watch fail, implement, watch pass
- Mock `useConvexAuth` via `vi.mock("convex/react")`
- Mock `useAuthActions` via `vi.mock("@convex-dev/auth/react")`
- Wrap components in `<MemoryRouter>` for routing tests
- Use `fireEvent` from @testing-library/react (no userEvent installed)

## Key Files

- **Spec:** `docs/superpowers/specs/2026-03-23-tech-stack-migration-design.md`
- **Phase plans:** `progress/phase-*/PLAN.md`
- **Convex guidelines:** `convex/_generated/ai/guidelines.md` (read before writing Convex code)

## Legacy Flask App

The original Flask/SQLite/Jinja2 app is still in the repo (`app/`, `templates/`, `run.py`, etc.) as a feature reference. It is NOT the active codebase — the React + Convex stack is.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
