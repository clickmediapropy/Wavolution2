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

## Tool Routing

Before starting any task, identify which category below it falls into and use the listed skills/CLIs.

### Convex Backend
| Task | Skill | CLI |
|------|-------|-----|
| Write queries/mutations/actions | `convex-functions` + read `convex/_generated/ai/guidelines.md` | `npx convex dev` |
| Modify schema.ts | `convex-schema-validator` | `npx convex dev --once` |
| Real-time subscriptions, pagination | `convex-realtime` | |
| File uploads (CSV, media) | `convex-file-storage` | |
| HTTP endpoints, webhooks | `convex-http-actions` | |
| Auth changes | `convex-setup-auth` | |
| Security review | `convex-security-check` | |
| Performance issues | `convex-performance-audit` | |
| General architecture | `convex-best-practices` | |

### Frontend (React + Vite)
| Task | Skill | CLI |
|------|-------|-----|
| New page or component | `react-vite-best-practices` | `vp dev` |
| Vite config, build issues | `vite` | `vp build`, `vp check` |
| UI design, visual polish | `frontend-design` or `ui-ux-pro-max` | |
| Accessibility | `accessibility-a11y` | |

### WhatsApp / Evolution API
| Task | Skill | CLI |
|------|-------|-----|
| Evolution API integration | `evolution-api` | |
| Test/manage WhatsApp instances | `evo-cli` | `evo-cli instance list` |
| Send test messages | `evo-cli` | `evo-cli message send-text` |

### Infrastructure
| Task | Skill | CLI |
|------|-------|-----|
| Dockerize campaign worker | `docker-expert` | |
| Process management on VPS | `pm2` | `ssh contabo` |
| Deploy, env vars, domains | use vercel skill | `vercel`, `vercel env` |
| Build failures | check logs | `vercel logs`, `vercel inspect` |

### Debugging
| Task | Skill | CLI |
|------|-------|-----|
| Production issues | `axiom-sre` | Axiom MCP (`mcp__axiom__queryDataset`) |
| Systematic debugging | `fix` | |

### Research
| Task | Skill | CLI |
|------|-------|-----|
| Look up external docs | `tavily-search` | `tvly search` |
| Find a skill | `find-skills` | `npx skills find [query]` |

### Compound Workflows
- **New Convex function + React page:** `convex-functions` → write function → `react-vite-best-practices` → write page → `npx vitest run`
- **CSV import:** `convex-file-storage` (upload) → `convex-functions` (parse) → `convex-realtime` (progress)
- **Campaign system:** `evolution-api` → `convex-http-actions` → `docker-expert` → `pm2`
- **Deploy to prod:** `vp check` → `npx vitest run` → `vercel --prod` → `axiom-sre` (verify)

### Active Phase
**Post-Phase 2 (Feature Parity)** — 12 features from message-hub added. Next: campaign worker on VPS.

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
├── schema.ts                  # All tables: users (extended), contacts, messages, campaigns, instances + authTables
├── contacts.ts                # CRUD, search, CSV import/export
├── campaigns.ts               # Create, start, stop, pause, resume, list
├── messages.ts                # Log, count, countToday, countRecent (rate limiting)
├── evolution.ts               # Evolution API actions (instance mgmt, send text/media)
├── instances.ts               # WhatsApp instance CRUD + connection state
├── storage.ts                 # File upload URL generation + serving
├── migrations.ts              # One-time data migrations (run via dashboard)
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
- **contacts** — userId, phone, firstName, lastName, status, sentAt. Indexes: by_userId, by_userId_and_phone, search_by_firstName
- **instances** — userId, name, apiKey, whatsappConnected, whatsappNumber, connectionStatus. Indexes: by_userId, by_userId_and_name
- **messages** — userId, campaignId, phone, message, status. Indexes: by_userId, by_campaignId
- **campaigns** — userId, status (draft|running|paused|completed|stopped), recipientType, total, processed, sent, failed, delay, messageTemplate, hasMedia, mediaStorageIds

### Testing Pattern
- TDD: write tests first, watch fail, implement, watch pass
- Mock `useConvexAuth` via `vi.mock("convex/react")`
- Mock `useAuthActions` via `vi.mock("@convex-dev/auth/react")`
- Wrap components in `<MemoryRouter>` for routing tests
- Use `fireEvent` from @testing-library/react (no userEvent installed)

## Gotchas

- **Schema field renames break push**: Renaming/removing a field in `convex/schema.ts` fails if existing DB docs have the old field. Keep deprecated fields as `v.optional()` + write a migration in `convex/migrations.ts`. Run via: `npx convex run --no-push internal.migrations.<name>`
- **`.gitignore` blocks `*.csv`**: Public assets like `public/sample-contacts.csv` need `git add -f`
- **DashboardPage test mocks are index-based**: `useQuery` mock returns by call index. Adding new queries shifts all subsequent mock returns — update the index map in the test.
- **`getFullName()` helper**: Use `getFullName(contact)` from `src/lib/utils.ts` to display contact names. Handles firstName+lastName with fallback to deprecated `name` field.
- **Campaign statuses**: `draft → running ↔ paused → stopped | completed`. The `stop` mutation accepts both running and paused.

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
