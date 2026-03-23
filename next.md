# Session Handoff — Message Hub (wavolution2)
Generated: 2026-03-23

## Project
WhatsApp bulk messaging platform. Multi-user system with auth, contact management, CSV import, media attachments, WhatsApp connection via QR code, and single messaging. Next: bulk campaign system.

## Stack
- Vite 8 + React 19 + TypeScript + Tailwind CSS v4 (Vercel)
- Convex Cloud (real-time DB + serverless functions)
- Convex Auth with Password provider
- Evolution API v2.3.7 on Contabo VPS (`evoapicloud/evolution-api` Docker image)
- Vitest + React Testing Library (TDD)

## What's Done
- **Phase 1** (Foundation): Auth, schema, routing, login/register/dashboard — `16a0b4e`
- **Phase 2** (Contacts): Full CRUD, CSV import, search, pagination — `0b89b2c`
- **Phase 3** (WhatsApp): Instance creation, QR code, connection polling, single text/media messaging — `a77c5d2`
  - `convex/evolution.ts` — 6 actions (createInstance, getQrCode, checkConnectionStatus, sendText, sendMedia, deleteInstance)
  - `convex/users.ts` — currentUser query + updateWhatsAppState mutation
  - `convex/storage.ts` — generateUploadUrl + getFileUrl
  - `convex/messages.ts` — logMessage + list
  - Pages: SetupWhatsAppPage, ConnectWhatsAppPage, SendMessagePage
  - Components: WhatsAppGuard, MediaUpload
  - 99 tests passing across 19 test files
- **Evolution API fix**: Upgraded from broken `atendai/evolution-api:v2.2.3` to working `evoapicloud/evolution-api:v2.3.7` (Dec 2025) — old Baileys had `Connection Failure` at noise-handler.js

## Current State
- App deployed at `bulk.agentifycrm.io` (Vercel). Convex prod: `reminiscent-chinchilla-427`
- Convex dev: `wandering-blackbird-22`
- Evolution API: `http://92.118.59.92:8080` (Contabo VPS, v2.3.7, QR codes working)
- Evolution API key in Convex env: `0d935fa643bc1a70e2f9507b2c1e8bcd0c1f0d148d8ff0625933caf6d5a861f4`
- Test account: `nico@agentifycrm.io` / `Nico@bulk`
- WhatsApp flow verified in browser: setup → QR code → scan → connected → send
- `convex/users.ts` has a minor uncommitted change (was used for temp reset mutation, already reverted to clean)

## What's Next
**Phase 4: Campaign System + VPS Worker** — see `progress/phase-4-campaigns/PLAN.md`

Key deliverables:
1. VPS Worker (`worker/` project): Express API for campaign processing, reads from Convex, sends via Evolution API, writes progress back
2. `convex/campaigns.ts` — create, updateProgress, stop, list queries
3. `BulkCampaignPage` — recipient selection, message template with {name}/{phone}, media, delay config
4. `CampaignStatusPage` — real-time progress (Convex subscription), stop button
5. `CampaignProgress` component

Build order: VPS worker first (campaigns need it), then Convex functions, then frontend.

## Key Context
- **Docker registry**: Use `evoapicloud/evolution-api` NOT `atendai/`. The `atendai` images have broken Baileys (Connection Failure). See updated skill at `.claude/skills/evolution-api/SKILL.md`
- **Evolution API v2.x requires PostgreSQL** — container crashes without it, even with `DATABASE_ENABLED=false`
- **Auth**: Use `getAuthUserId(ctx)` from `@convex-dev/auth/server` — never email lookup
- **Convex imports**: Use `@convex/_generated/api` alias (not relative paths)
- **sendMedia accepts storageId** not mediaUrl — resolves URL server-side via `ctx.runQuery(api.storage.getFileUrl)`
- **VPS SSH**: `ssh contabo` (92.118.59.92), docker-compose at `/root/wavolution/`
- **Hostinger also has Evolution API**: `ssh hostinger`, same v2.3.7 setup for reference

## Commands to Start
```bash
npm run dev          # Vite dev server on :5173
npx convex dev       # Convex dev server
npm test             # Run all 99 tests
npm run check        # Format + lint + type check
ssh contabo          # VPS access
```
