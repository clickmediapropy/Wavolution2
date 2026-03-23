# UI Polish + WhatsApp Management — Design Spec

> Implements remaining polish items from `ui-inspiration.md` plus a new
> WhatsApp instance management page. Two-phase approach: shadcn/ui foundation
> first, then parallel team for all polish and new features.
>
> **Already implemented (not in scope):** AppLayout nav icons/hamburger,
> password toggles, ContactFormDialog merge, count badge, filter chips,
> sortable columns, drag-drop uploads, StepIndicator, searchable combobox,
> WhatsApp preview, MediaUpload thumbnails/auto-upload, BulkCampaignPage
> multi-step, CampaignStatusPage, DashboardPage rewrite, LandingPage base,
> NotFoundPage, ErrorBoundary, LoadingSkeleton variants, ResponsiveContactTable.

**Date:** 2026-03-23
**Status:** Approved
**Scope:** 20 items across 8 areas

---

## Phase 1: shadcn/ui Foundation (Sequential)

### Goal

Install shadcn/ui with dark mode zinc/emerald tokens. Migrate 6 specific
Radix primitives that replace custom implementations. Do NOT migrate Button,
Input, or Label — the current custom classes are fine.

### Setup

- `npx shadcn@latest init` with Vite 8 + Tailwind v4
- Theme: zinc base, emerald primary, dark mode default
- CSS variables using oklch color space
- `cn()` utility already exists at `src/lib/utils.ts`

### Primitives to Migrate

| Primitive | Replaces | Files Affected | Why |
|-----------|----------|----------------|-----|
| Dialog | Custom modal overlay | ContactFormDialog.tsx, DeleteConfirmDialog.tsx | Focus trap, Esc handling, animate-in/out, DialogDescription for a11y |
| Badge | Custom status `<span>` | ContactTable.tsx, CampaignStatusPage.tsx | Variant system, consistent sizing |
| Progress | Custom div progress bar | CampaignStatusPage.tsx | Radix translateX animation, accessible progressbar role |
| Skeleton | Custom animate-pulse divs | LoadingSkeleton.tsx | Standardized shapes, consistent timing |
| Slider | `<input type="range">` | DelayConfig.tsx | Thumb styling, accessible, consistent |
| RadioGroup | Custom radio inputs | RecipientSelector.tsx | Keyboard navigation, Radix accessibility |

### Constraints

- Do NOT change the visual appearance — same zinc/emerald tokens
- Do NOT touch Button, Input, Label components
- Keep existing test files passing
- Run `npm run check` and `npm test` after migration

---

## Phase 2: Parallel Team (4 Agents)

### Agent A — Auth + Landing Polish

**Files:** `LoginPage.tsx`, `RegisterPage.tsx`, `LandingPage.tsx`

#### LoginPage (3 items)

1. **Gradient submit button**
   - Replace `bg-emerald-600 hover:bg-emerald-500` with
     `bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400
     hover:from-emerald-500 hover:via-emerald-400 hover:to-emerald-300`
   - Apply to the form submit button only

2. **Background decoration**
   - Add a radial gradient blur behind the auth card
   - Implementation: `before:` pseudo-element on the page wrapper with
     `bg-emerald-500/20 blur-3xl rounded-full` positioned behind the card
   - Must not affect layout or interactivity (pointer-events-none, -z-10)

3. **framer-motion card entrance**
   - Wrap the card section in `<motion.div initial={{ opacity: 0, y: 20 }}
     animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>`
   - Remove the CSS `animate-fadeInUp` class (replaced by framer-motion)

#### RegisterPage (3 items)

4. **Gradient submit button** — Same as LoginPage

5. **Password strength indicator**
   - 4 small bars below the password field
   - Pure CSS, no library
   - Logic: 0 bars = empty, 1 = <6 chars, 2 = 6+ chars, 3 = 6+ with
     mixed case or numbers, 4 = 8+ with mixed case AND numbers AND special
   - Colors: red → amber → emerald progression
   - Implementation: `<div className="flex gap-1 mt-2">` with 4
     `<div className="h-1 flex-1 rounded-full">` bars

6. **framer-motion card entrance** — Same as LoginPage

#### LandingPage (4 items)

7. **Announcement badge**
   - `<aside className="mb-8 inline-flex items-center gap-2 px-4 py-2
     rounded-full border border-zinc-700 bg-zinc-800/50 text-sm
     text-zinc-300">` with Zap icon + "Now with WhatsApp Business API"
   - Position above the heading

8. **Gradient-text heading**
   - Replace current heading with gradient text technique:
     `style={{ background: "linear-gradient(to bottom, #fff,
     rgba(255,255,255,0.6))", WebkitBackgroundClip: "text",
     WebkitTextFillColor: "transparent" }}`

9. **Dashboard screenshot with glow**
   - Add a screenshot/mockup image below the hero CTAs
   - Behind it: absolute positioned `bg-emerald-500/20 blur-3xl` glow div
   - Wrap in `<div className="relative mt-16 max-w-4xl mx-auto">`
   - If no real screenshot available, use a styled placeholder card that
     mimics the dashboard layout (stat cards + table skeleton)

10. **Trust badges / stats section**
    - Section below hero with 3-4 stat counters:
      "Bulk Messaging", "Real-time Tracking", "WhatsApp Business API",
      "CSV Import"
    - Pattern: `<div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">`
      with icon + label cards

### Agent B — WhatsApp Management Page

**Files:** `WhatsAppPage.tsx` (new), `AppLayout.tsx`, `DashboardPage.tsx`,
`App.tsx`

#### New WhatsAppPage (1 page)

11. **WhatsApp management page** at `/whatsapp`
    - Smart rendering based on user state:
      - **No instance created:** Setup CTA (icon, heading, description,
        "Create Instance" button). Reuse logic from SetupWhatsAppPage.
      - **Instance created but disconnected:** QR code flow (reuse
        ConnectWhatsAppPage logic). Show QR, refresh button, polling.
      - **Connected:** Status card showing:
        - Instance name (monospace)
        - Connection status with ping animation
        - Phone number if available
        - "Disconnect" button (destructive)
        - "Reconnect" button (secondary)
    - Use the same StepIndicator showing which phase the user is in
    - Page header: Smartphone icon + "WhatsApp" heading

12. **Nav item in AppLayout**
    - The `navItems` array uses `as const` — remove the `as const`
      assertion before adding the new entry, then re-add it to preserve
      type-narrowing on the icon type
    - Add `{ to: "/whatsapp", label: "WhatsApp", icon: Smartphone }` to
      `navItems` array (after "Send")
    - Import `Smartphone` from lucide-react

13. **Route in App.tsx + redirect old routes**
    - Add `/whatsapp` route wrapped in `<ProtectedRoute>`
    - Convert `/whatsapp/setup` and `/whatsapp/connect` routes to simple
      `<Navigate to="/whatsapp" replace />` redirects — all smart-rendering
      logic lives in WhatsAppPage now, the old routes are kept only for
      backward compatibility with bookmarks

14. **Enhance existing ConnectionStatus on Dashboard**
    - DashboardPage already renders `<ConnectionStatus>` as a stat card.
      Do NOT add a second WhatsApp card — enhance the existing one.
    - Add a `<Link to="/whatsapp">` wrapper or "Manage" link so clicking
      the ConnectionStatus card navigates to the new WhatsApp page
    - Keep the existing connected/disconnected visual treatment

### Agent C — Component Polish

**Files:** `RecentMessages.tsx`, `ContactFormDialog.tsx`,
`DeleteConfirmDialog.tsx`

#### RecentMessages (4 items)

15. **Contact name display**
    - Currently only shows phone number. Need contact names alongside.
    - **Data strategy:** Add `useQuery(api.contacts.listByUserId)` inside
      RecentMessages and build a local `phoneToName` map using the
      existing `by_userId` index. Do NOT modify the messages query.
    - If name exists: show name (primary) + phone (secondary, monospace)
    - If no name: show phone (primary)

16. **Relative timestamps**
    - Replace exact date display with relative time ("2m ago", "1h ago",
      "Yesterday")
    - Pure function, no library: calculate diff from `Date.now()` and
      format as relative string
    - Update on re-render (messages component re-renders on new data)

17. **Visible dividers + layout**
    - Change from `space-y-2` to `divide-y divide-zinc-800`
    - Adjust item padding to `py-3` for proper divide spacing

18. **"View all" link**
    - There is no dedicated messages page yet. Link to campaigns instead:
      `<Link to="/campaigns/new" className="text-sm text-emerald-400
      hover:text-emerald-300">Send new campaign →</Link>` at bottom
    - Only show when there are messages
    - NOTE: A full message history page can be added in a future phase

#### ContactFormDialog (1 item)

19. **DialogDescription subtitle**
    - Add subtitle below the dialog title:
      - Add mode: "Add a new contact to your list"
      - Edit mode: "Update contact details"
    - Phase 1 migrates ContactFormDialog to shadcn Dialog — use the
      `DialogDescription` component directly. Agent C runs AFTER Phase 1,
      so the shadcn Dialog components will be available.
    - If for any reason Phase 1 hasn't completed, use a plain
      `<p className="text-sm text-zinc-500 mt-1">` as temporary fallback

#### DeleteConfirmDialog (1 item)

20. **Type-to-confirm for bulk deletes**
    - When `count > 5`, require the user to type "DELETE" to enable the
      confirm button
    - Add an input field: `<input placeholder='Type "DELETE" to confirm'>`
    - Confirm button disabled until input matches "DELETE"
    - For count <= 5, keep the current simple confirm behavior

### Agent D — Animations (framer-motion + react-countup)

**Files:** Multiple (animation wrappers only, no layout changes)

#### framer-motion (global)

- `npm install framer-motion`
- **LoginPage / RegisterPage:** card entrance (handled by Agent A, but
  Agent D installs the dependency)
- **Dialog components:** After Phase 1 migrates to shadcn Dialog, add
  `animate-in`/`animate-out` with zoom-in-95 + fade. This is built into
  shadcn Dialog — just ensure the animation classes are present.
- **UploadContactsPage drop zone:** Add `<motion.div whileHover={{
  scale: 1.01 }} whileTap={{ scale: 0.99 }}>` wrapper on the drop zone
- **BulkCampaignPage drop zone:** Same scale animation on MediaUpload
  drop zone
- **Page transitions:** Add `<motion.div initial={{ opacity: 0 }}
  animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>` wrapper
  to replace CSS `animate-fadeIn` on pages that use it

#### react-countup

- `npm install react-countup`
- **StatsCard:** Wrap the value display in `<CountUp end={value}
  duration={1} separator="," />` for numeric values
- Only animate on initial render, not on every re-render
- Handle non-numeric values gracefully (pass through as-is)

---

## Dependency Graph

```
Phase 1 (shadcn/ui)
  │
  ├─── blocks ──→ Agent C (needs shadcn Dialog for ContactFormDialog)
  │
  └─── Agent D installs framer-motion (independent of shadcn)
       │
       ├─── Agent A uses framer-motion (LoginPage, RegisterPage)
       │
       └─── Agent D adds animations to other pages

Phase 2 agents can run in parallel AFTER Phase 1 completes.

CRITICAL: npm install must complete BEFORE any agent writes code
that imports the new packages.

Recommended launch order:
1. Phase 1: shadcn/ui agent (sequential, must complete fully)
2. Dependency install checkpoint: run `npm install framer-motion
   react-countup` and verify both appear in package.json before
   proceeding. This is a blocking gate — no agent writes code
   until this completes.
3. Agents A, B, C, D: launch in parallel (all deps are installed)
   - Agent A imports framer-motion (already in node_modules)
   - Agent D adds animation wrappers + countup (already installed)
```

---

## File Ownership (Conflict Prevention)

| File | Owner | Notes |
|------|-------|-------|
| LoginPage.tsx | Agent A | gradient, bg decoration, motion |
| RegisterPage.tsx | Agent A | gradient, pw strength, motion |
| LandingPage.tsx | Agent A | badge, gradient text, screenshot, trust |
| WhatsAppPage.tsx | Agent B | new file |
| AppLayout.tsx | Agent B | nav item only |
| App.tsx | Agent B | route only |
| DashboardPage.tsx | Agent B | WhatsApp card |
| RecentMessages.tsx | Agent C | names, timestamps, dividers, link |
| ContactFormDialog.tsx | Agent C | subtitle |
| DeleteConfirmDialog.tsx | Agent C | type-to-confirm |
| StatsCard.tsx | Agent D | countup |
| UploadContactsPage.tsx | Agent D | motion wrapper |
| MediaUpload.tsx | Agent D | motion wrapper |
| LoadingSkeleton.tsx | Phase 1 | shadcn Skeleton |
| DelayConfig.tsx | Phase 1 | shadcn Slider |
| RecipientSelector.tsx | Phase 1 | shadcn RadioGroup |
| CampaignStatusPage.tsx | Phase 1 | shadcn Progress + Badge |
| ContactTable.tsx | Phase 1 | shadcn Badge |

---

## Testing Strategy

- Each agent runs `npm run check` before committing
- Each agent runs `npm test` to verify no regressions
- Existing test mocks for ContactFormDialog and DeleteConfirmDialog may
  need updates after shadcn Dialog migration (Phase 1 handles this)
- No new test files required for pure visual polish
- WhatsAppPage (Agent B) should have basic render tests

---

## Success Criteria

1. All 20 items from the gap analysis are implemented
2. `npm run check` passes (format + lint + types)
3. `npm test` passes (all existing tests)
4. No visual regressions on existing pages
5. WhatsApp management accessible from nav + dashboard
6. framer-motion and react-countup integrated without layout shifts
7. shadcn/ui primitives replace custom implementations seamlessly
