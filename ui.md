# UI Map — Message Hub (wavolution2)

Complete inventory of all pages, components, and utilities. Items marked with checkmarks exist; unmarked items are pending.

---

## Routes

| Route | Page | Guard | Status |
|-------|------|-------|--------|
| `/` | LoginPage | AnonymousRoute | Done |
| `/register` | RegisterPage | AnonymousRoute | Done |
| `/dashboard` | DashboardPage | ProtectedRoute | Shell only — Phase 5 rewrite pending |
| `/contacts` | ContactsPage | ProtectedRoute | Done |
| `/contacts/upload` | UploadContactsPage | ProtectedRoute | Done |
| `/whatsapp/setup` | SetupWhatsAppPage | ProtectedRoute | Done |
| `/whatsapp/connect` | ConnectWhatsAppPage | ProtectedRoute | Done |
| `/send` | SendMessagePage | ProtectedRoute + WhatsAppGuard | Done |
| `/campaigns` | BulkCampaignPage | ProtectedRoute + WhatsAppGuard | Phase 4 |
| `/campaigns/:id` | CampaignStatusPage | ProtectedRoute | Phase 4 |
| `/landing` | LandingPage | (public) | Phase 6 |
| `*` | NotFoundPage | (none) | Phase 6 |

---

## Pages

### Done

| File | Description |
|------|-------------|
| `src/pages/LoginPage.tsx` | Email/password login form |
| `src/pages/RegisterPage.tsx` | Name/email/password registration form |
| `src/pages/DashboardPage.tsx` | Dashboard shell (placeholder — rewritten in Phase 5) |
| `src/pages/ContactsPage.tsx` | Contact list with search, pagination, add/edit/delete |
| `src/pages/UploadContactsPage.tsx` | CSV import — file picker, preview table, confirm upload |
| `src/pages/SetupWhatsAppPage.tsx` | Create Evolution API instance |
| `src/pages/ConnectWhatsAppPage.tsx` | QR code scanning to connect WhatsApp |
| `src/pages/SendMessagePage.tsx` | Single message sending — text + media attachments |

### Phase 4 — Campaign System

| File | Description |
|------|-------------|
| `src/pages/BulkCampaignPage.tsx` | Recipient selection (all/pending/selected), message template with `{name}`/`{phone}` personalization preview, media upload, delay slider, start button |
| `src/pages/CampaignStatusPage.tsx` | Real-time progress bar, sent/failed/remaining counts, ETA, stop button. Subscribes to Convex campaign query |

### Phase 5 — Dashboard Rewrite

| File | Description |
|------|-------------|
| `src/pages/DashboardPage.tsx` | Full rewrite: 4 StatsCards grid, connection status indicator, recent messages list (last 5), active campaign progress (inline CampaignProgress), quick action buttons to /send, /campaigns, /contacts |

### Phase 6 — Polish

| File | Description |
|------|-------------|
| `src/pages/LandingPage.tsx` | Public marketing page — hero section, features list, login/register CTAs. Same design direction as original Flask landing |
| `src/pages/NotFoundPage.tsx` | 404 catch-all — friendly message + "Go Home" link |

---

## Components

### Done

| File | Description |
|------|-------------|
| `src/components/AppLayout.tsx` | Navbar (auth-aware logout), footer, Sonner toast container |
| `src/components/ProtectedRoute.tsx` | Auth guard — redirects to `/` if not authenticated |
| `src/components/AnonymousRoute.tsx` | Inverse guard — redirects to `/dashboard` if authenticated |
| `src/components/WhatsAppGuard.tsx` | Checks WhatsApp connection — redirects to setup if not connected |
| `src/components/ContactTable.tsx` | Paginated contact table with search, select, status badges |
| `src/components/AddContactDialog.tsx` | Dialog form to add a single contact |
| `src/components/EditContactDialog.tsx` | Dialog form to edit an existing contact |
| `src/components/DeleteConfirmDialog.tsx` | Confirmation dialog before deleting a contact |
| `src/components/MediaUpload.tsx` | File upload for images/videos with validation (type + size) |

### Phase 4 — Campaign System

| File | Description |
|------|-------------|
| `src/components/CampaignProgress.tsx` | Reusable progress display — progress bar, sent/failed/remaining counts, ETA. Subscribes to Convex for real-time updates. Used in CampaignStatusPage and DashboardPage |
| `src/components/RecipientSelector.tsx` | Radio group (all/pending/selected) + optional contact checkboxes when "selected" is chosen |
| `src/components/MessageTemplateEditor.tsx` | Textarea with `{name}`/`{phone}` token buttons and live preview panel |
| `src/components/DelayConfig.tsx` | Slider or input for configuring delay between messages (default: 5s) |

### Phase 5 — Dashboard

| File | Description |
|------|-------------|
| `src/components/StatsCard.tsx` | Reusable stat card — Lucide icon, label, numeric value |
| `src/components/ConnectionStatus.tsx` | Green/red dot indicator + status text (connected/disconnected) |
| `src/components/RecentMessages.tsx` | List of last 5 messages — contact name, message preview (truncated), timestamp |
| `src/components/QuickActions.tsx` | Button group linking to Send Message, Bulk Send, View Contacts |

### Phase 6 — Polish

| File | Description |
|------|-------------|
| `src/components/ErrorBoundary.tsx` | React error boundary — catches rendering errors, shows fallback with retry button |
| `src/components/LoadingSkeleton.tsx` | Skeleton loading states for pages (replaces raw spinners) |
| `src/components/MobileNav.tsx` | Hamburger menu for navbar on mobile viewports |
| `src/components/ResponsiveContactTable.tsx` | Card layout alternative for ContactTable on mobile (or horizontal scroll wrapper) |

---

## Utilities

| File | Description | Status |
|------|-------------|--------|
| `src/lib/utils.ts` | `cn()` utility (clsx + tailwind-merge) | Done |
| `src/lib/csv.ts` | CSV parsing for contact import | Done |

---

## UI Primitives

No shadcn/ui `components/ui/` directory yet. All components are custom. Phase 5+ may benefit from introducing shadcn primitives (Card, Badge, Progress, Skeleton, Sheet).

---

## Summary

| Category | Done | Pending | Total |
|----------|------|---------|-------|
| Pages | 8 | 4 (+1 rewrite) | 12 |
| Components | 9 | 8 | 17 |
| Utilities | 2 | 0 | 2 |
| **Total** | **19** | **12** | **31** |
