# UI Map — Message Hub (wavolution2)

Complete inventory of all pages, components, and utilities. All items are implemented.

---

## Routes

| Route | Page | Guard | Notes |
|-------|------|-------|-------|
| `/` | LandingPage | AnonymousRoute | Public marketing page |
| `/login` | LoginPage | AnonymousRoute | Gradient button, background glow, framer-motion |
| `/register` | RegisterPage | AnonymousRoute | Password strength indicator, framer-motion |
| `/dashboard` | DashboardPage | ProtectedRoute | Stats grid, connection status, recent messages, quick actions |
| `/contacts` | ContactsPage | ProtectedRoute | Table with search, sort, filter chips, bulk actions |
| `/contacts/upload` | UploadContactsPage | ProtectedRoute | Drag-drop CSV import with step indicator |
| `/whatsapp` | WhatsAppPage | ProtectedRoute | Unified: setup, QR scan, connected states, multi-instance |
| `/whatsapp/setup` | → redirect | — | Redirects to `/whatsapp` |
| `/whatsapp/connect` | → redirect | — | Redirects to `/whatsapp` |
| `/send` | SendMessagePage | ProtectedRoute + WhatsAppGuard | Text + media, searchable combobox, message preview |
| `/campaigns` | CampaignHistoryPage | ProtectedRoute | Campaign list/history |
| `/campaigns/new` | BulkCampaignPage | ProtectedRoute | Recipient selector, template editor, media, delay config |
| `/campaigns/:id` | CampaignStatusPage | ProtectedRoute | Real-time progress, sent/failed/remaining, stop button |
| `*` | NotFoundPage | (none) | 404 catch-all |

---

## Pages (14)

| File | Description |
|------|-------------|
| `src/pages/LandingPage.tsx` | Announcement badge, gradient heading, dashboard mockup, features grid, login/register CTAs |
| `src/pages/LoginPage.tsx` | Email/password login with gradient button, background glow, framer-motion entrance animation |
| `src/pages/RegisterPage.tsx` | Name/email/password with gradient button, password strength indicator, framer-motion |
| `src/pages/DashboardPage.tsx` | 4 StatsCards grid (animated countup), ConnectionStatus card, RecentMessages list, QuickActions |
| `src/pages/ContactsPage.tsx` | ContactTable with count badge, status filter chips, sortable columns, bulk delete |
| `src/pages/UploadContactsPage.tsx` | StepIndicator, drag-drop zone, CSV preview table, confirm upload |
| `src/pages/WhatsAppPage.tsx` | Smart rendering: setup form / QR code scanner / connected management. Multi-instance support |
| `src/pages/SetupWhatsAppPage.tsx` | Legacy — redirects handled in router, kept for reference |
| `src/pages/ConnectWhatsAppPage.tsx` | Legacy — redirects handled in router, kept for reference |
| `src/pages/SendMessagePage.tsx` | SearchableCombobox for contacts, MessageTemplateEditor, MediaUpload, MessagePreview |
| `src/pages/BulkCampaignPage.tsx` | RecipientSelector, MessageTemplateEditor, MediaUpload, DelayConfig, start campaign |
| `src/pages/CampaignStatusPage.tsx` | Real-time progress bar, sent/failed/remaining counts, ETA, stop button |
| `src/pages/CampaignHistoryPage.tsx` | Campaign list with status badges, links to individual campaign status |
| `src/pages/NotFoundPage.tsx` | 404 illustration + "Go Home" link |

---

## Components (20)

### Layout & Guards
| File | Description |
|------|-------------|
| `src/components/AppLayout.tsx` | Navbar with Lucide icons (LayoutDashboard/Users/Send), auth-aware logout, footer, Sonner toasts |
| `src/components/ProtectedRoute.tsx` | Auth guard — redirects to `/` if not authenticated |
| `src/components/AnonymousRoute.tsx` | Inverse guard — redirects to `/dashboard` if authenticated |
| `src/components/WhatsAppGuard.tsx` | Checks WhatsApp connection — redirects to `/whatsapp` if not connected |
| `src/components/ErrorBoundary.tsx` | React error boundary — catches rendering errors, shows fallback with retry button |

### Data Display
| File | Description |
|------|-------------|
| `src/components/ContactTable.tsx` | Paginated table with search, select, sortable columns, status filter chips, bulk actions |
| `src/components/StatsCard.tsx` | Stat card with Lucide icon, label, animated numeric value (react-countup) |
| `src/components/ConnectionStatus.tsx` | Green/red dot indicator + status text, links to `/whatsapp` |
| `src/components/RecentMessages.tsx` | Last 5 messages — contact names, relative timestamps, dividers, campaign link |
| `src/components/LoadingSkeleton.tsx` | Skeleton shimmer loading states for pages |
| `src/components/MessagePreview.tsx` | Live preview of composed message with personalization tokens |

### Forms & Input
| File | Description |
|------|-------------|
| `src/components/ContactFormDialog.tsx` | Unified add/edit contact dialog with subtitle for mode indication |
| `src/components/DeleteConfirmDialog.tsx` | Type-to-confirm destructive action dialog |
| `src/components/SearchableCombobox.tsx` | Searchable dropdown combobox with WhatsApp number display |
| `src/components/MediaUpload.tsx` | Drag-drop file upload with framer-motion scale animations, type/size validation |
| `src/components/StepIndicator.tsx` | Multi-step wizard progress indicator with emerald active styling |

### Campaign
| File | Description |
|------|-------------|
| `src/components/RecipientSelector.tsx` | Radio group (all/pending/selected) + optional contact checkboxes |
| `src/components/MessageTemplateEditor.tsx` | Textarea with `{name}`/`{phone}` token buttons and live preview panel |
| `src/components/DelayConfig.tsx` | Slider/input for delay between messages (default: 5s) |

### Dashboard
| File | Description |
|------|-------------|
| `src/components/QuickActions.tsx` | Button group linking to Send Message, Bulk Send, View Contacts |

---

## Utilities

| File | Description |
|------|-------------|
| `src/lib/utils.ts` | `cn()` utility (clsx + tailwind-merge) |
| `src/lib/csv.ts` | CSV parsing for contact import |
| `src/lib/relativeTime.ts` | Relative timestamp formatting (e.g. "2 hours ago") |
| `src/lib/passwordStrength.ts` | Password strength scoring for registration |

---

## UI Stack

| Package | Purpose |
|---------|---------|
| `tailwind-merge` + `clsx` | Conditional class merging via `cn()` |
| `lucide-react` | Icon library (LayoutDashboard, Users, Send, etc.) |
| `framer-motion` | Entrance animations, drag-drop scale effects |
| `react-countup` | Animated numeric values in StatsCards |
| `sonner` | Toast notifications |

No shadcn/ui `components/ui/` directory. All components are custom with Tailwind CSS v4.

---

## Summary

| Category | Count |
|----------|-------|
| Active pages | 12 (+ 2 legacy redirects) |
| Components | 20 |
| Utilities | 4 |
| **Total** | **36** |
