# UI Inspiration Map

> Design audit for Message Hub (wavolution2). Each section documents current state,
> inspiration from 21st.dev, and specific patterns to steal.
>
> **Design direction:** Dark mode, data-dense, professional SaaS dashboard.
> **Stack:** Vite 8 + React 19 + Tailwind CSS v4 (no shadcn/ui yet).

---

## Design System Foundation

Before touching any component, lock in these tokens. Every "steal this" below
must be filtered through this system — not adopted verbatim.

### Visual Identity

**Mood:** Operational control room. Think Bloomberg Terminal meets Linear.
Not playful, not corporate — *competent*. The UI should feel like it gets out
of the way and lets the operator work fast.

### Typography Scale

| Role | Size | Weight | Color | Usage |
|------|------|--------|-------|-------|
| Page title | text-2xl (24px) | font-bold | text-zinc-100 | One per page, top-left |
| Section heading | text-lg (18px) | font-semibold | text-zinc-100 | Card headers, dialog titles |
| Body | text-sm (14px) | font-normal | text-zinc-300 | Default text, form labels |
| Caption | text-xs (12px) | font-medium | text-zinc-500 | Timestamps, hints, badges |
| Mono | text-sm font-mono | font-normal | text-zinc-300 | Phone numbers, IDs, code |

### Color Semantics

| Role | Token | Usage |
|------|-------|-------|
| Surface | bg-zinc-950 | Page background |
| Card | bg-zinc-900 | Elevated containers |
| Border | border-zinc-800 | Card/input borders |
| Border hover | border-zinc-700 | Hover states on interactive containers |
| Primary action | bg-emerald-600 / hover:bg-emerald-500 | CTAs, primary buttons |
| Destructive | bg-red-600 / hover:bg-red-500 | Delete, stop campaign |
| Success | text-emerald-400, bg-emerald-500/10 | Sent status, connected |
| Warning | text-amber-400, bg-amber-500/10 | Pending status |
| Error | text-red-400, bg-red-500/10 | Failed status, errors |
| Muted text | text-zinc-500 | Helper text, captions |

### Spacing Rhythm

| Context | Value | Example |
|---------|-------|---------|
| Page padding | px-4 sm:px-6 lg:px-8 | AppLayout main area |
| Card padding | p-6 | All cards and dialogs |
| Form field gap | space-y-4 | Vertical form fields |
| Section gap | mb-6 | Between page header and content |
| Button group gap | gap-3 | Side-by-side buttons |
| Table cell padding | px-4 py-3 | All table cells |

### Component Conventions

| Element | Radius | Shadow | Pattern |
|---------|--------|--------|---------|
| Card | rounded-xl | none (border only) | `bg-zinc-900 border border-zinc-800 rounded-xl` |
| Input | rounded-lg | none | `bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500/50` |
| Button (primary) | rounded-lg | none | `bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg` |
| Button (secondary) | rounded-lg | none | `bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg` |
| Badge | rounded-full | none | `px-2.5 py-0.5 rounded-full text-xs font-medium` |
| Dialog | rounded-xl | shadow-2xl | `bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl` |

### Implementation Priority

**Tier 1 — High impact, do now** (existing components, visible improvement):
- ContactTable: pagination + sort indicators
- UploadContactsPage: drag-and-drop zone
- SendMessagePage: replace native `<select>` with custom combobox
- ConnectWhatsAppPage: white QR background + skeleton loading

**Tier 2 — Medium impact, do with next phase**:
- LoginPage / RegisterPage: motion entrance + password toggle
- AddContactDialog + EditContactDialog: merge into ContactFormDialog
- SetupWhatsAppPage + ConnectWhatsAppPage: step indicator
- MediaUpload: drag-and-drop + auto-upload

**Tier 3 — Build fresh with these patterns** (pending components):
- BulkCampaignPage (Phase 4): multi-step form
- CampaignStatusPage (Phase 4): progress + stats grid
- DashboardPage rewrite (Phase 5): stat cards + activity feed
- LandingPage (Phase 6): hero + CTAs

**Tier 4 — Polish** (defer until core is solid):
- framer-motion animations (all pages)
- react-countup for dashboard numbers
- LoadingSkeleton variants
- ResponsiveContactTable card layout

---

## Batch 1 — Auth & Layout

### AppLayout
- **Status:** Existing — improve (keep top nav)
- **Current:** Sticky top navbar with logo, 3 NavLinks (Dashboard, Contacts, Send), logout button. Uses `bg-zinc-900/80 backdrop-blur-xl`. No mobile hamburger, no footer.
- **Inspiration found:**
  - **Sidebar Component** (21st.dev) — Full collapsible sidebar with icon groups. Reviewed but **rejected** — sidebars are for 8+ nav items. Message Hub has 4-5 routes.
  - **SaaS Template Navigation** — Fixed top nav with centered links, sign-in/sign-up on right, mobile hamburger that slides down. Clean and appropriate for this route count.
- **Steal this:** Keep horizontal top nav. Improve it: (1) add Lucide icons next to each nav label for scanability, (2) add a mobile hamburger for `<md` viewports, (3) add a subtle bottom border glow on the active nav item instead of just background color.
- **Implementation note:** Add icons: `<LayoutDashboard className="w-4 h-4" />` next to "Dashboard", `<Users />` next to "Contacts", `<Send />` next to "Send", `<Megaphone />` next to "Campaigns" (Phase 4). Active state: keep `bg-emerald-500/10 text-emerald-400` but add `border-b-2 border-emerald-500` for stronger active signal. On mobile (`md:hidden`), render a `<Menu />` hamburger that toggles a dropdown panel. When Phase 4 adds Campaigns, the nav will have 4 items — still fine for horizontal.

### LoginPage
- **Status:** Existing — improve
- **Current:** Centered card with emerald logo icon, "Welcome back" heading, email/password fields, submit button, register link. Clean but plain — no motion, no visual interest beyond the icon.
- **Inspiration found:**
  - **Auth Form** (21st.dev) — Framer Motion entrance animation (`opacity: 0, y: 25` to visible), social login buttons grid, "OR" divider, "Forgot?" link next to password label, background grid SVG decoration fading with radial gradient. Dark mode native.
  - **Sign In (LightLogin)** — Password show/hide toggle button, gradient submit button (`from-blue-600 via-blue-500 to-blue-400`), social login grid (Google/GitHub), elevated card with subtle shadow. h-12 input height for better touch targets.
  - **Login Card** — Minimal shadcn-based card with clean Label/Input/Button primitives.
- **Steal this:** Add Framer Motion fade-in-up on the card (replace CSS `animate-fadeIn`). Add a password show/hide toggle. Add subtle background decoration (grid pattern or gradient blur). Use a gradient-tinted submit button instead of flat `bg-emerald-600`.
- **Implementation note:** Install `framer-motion`. Wrap card in `<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>`. Add `Eye`/`EyeOff` toggle from lucide-react next to password input. Replace submit with `bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400`. Consider adding a subtle `before:` pseudo-element with a radial gradient blur behind the card for depth.

### RegisterPage
- **Status:** Existing — improve
- **Current:** Nearly identical to LoginPage with added name and confirm password fields. Same centered card layout.
- **Inspiration found:**
  - **Signup Form (Aceternity)** — First/last name in a 2-column grid on desktop, bottom gradient glow animation on hover over submit button, social login options with icon + label.
  - **Registration** — Full card with CardHeader/CardContent/CardFooter pattern, password eye toggle, terms checkbox with links, role selector dropdown. Card footer with border-top separator.
  - **Login Card** — Same clean primitives as above.
- **Steal this:** Add password show/hide toggle (same as LoginPage). Add a `border-t` separator for the "Already have an account?" link to create visual hierarchy. Keep single Name field (Convex Auth uses a single `name` field — splitting would require schema changes for no user benefit).
- **Implementation note:** Add the same motion wrapper as LoginPage. Add `Eye`/`EyeOff` toggle on both password fields. Add `border-t border-zinc-800 pt-4 mt-2` to the sign-in link section. Consider a lightweight password strength indicator: 4 small bars that fill based on length + character variety (pure CSS, no library).

---

## Batch 2 — Contacts

### ContactsPage
- **Status:** Existing — improve
- **Current:** Page header with icon + title, Upload CSV + Add Contact buttons, search input with icon, ContactTable component, 3 dialog components. Well-structured but page header could use more visual weight.
- **Inspiration found:**
  - **Contact 2** (shadcnblocks) — Two-column layout with contact info sidebar and form. Good pattern for info density.
  - **Dark Contact Section** — Gradient blur background decoration behind form, clean spacing with `max-w-screen-xl`.
- **Steal this:** Add a subtle count badge next to the "Contacts" heading showing total contacts. Add filter chips/tabs above the search bar (All / Pending / Sent / Failed) for quick status filtering.
- **Implementation note:** Add `<span className="text-sm text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full ml-2">{count}</span>` next to the heading. Consider a row of filter buttons using the same `statusConfig` colors from ContactTable for visual consistency.

### ContactTable
- **Status:** Existing — improve
- **Current:** HTML `<table>` with checkbox select-all, name/phone/status/actions columns, status badges with colored dots, edit/delete icon buttons, "Load more" pagination. Clean implementation.
- **Inspiration found:**
  - **Paginated Table (TanStack)** — Full TanStack Table with column sorting (chevron up/down indicators), pagination with first/prev/next/last buttons + rows-per-page selector, Badge components for status, proper Checkbox primitives from Radix.
  - **Data Table patterns** — Column header sort indicators, sticky header on scroll, row hover highlights with subtle background shift.
- **Steal this:** Keep "Load more" (correct for Convex cursor pagination) but upgrade its visual treatment. Add column sort indicators on Name and Status headers. Improve the empty state with a larger illustration area.
- **Implementation note:** "Load more" button: upgrade to full-width with a count label: `<button className="w-full py-2.5 text-sm ...">Load more · {results.length} loaded</button>`. Add client-side sorting: `onClick` on `<th>` toggles `sortField` + `sortDir` in state, `useMemo` sorts the already-loaded results. Don't install TanStack Table — the current HTML table is fine for 4 columns. For status badges, the current dot+span pattern is already good; defer Badge component to shadcn adoption in Phase 5.

### AddContactDialog
- **Status:** Existing — improve
- **Current:** Custom modal overlay with backdrop blur, form with phone (required) + name (optional), cancel/submit buttons. Uses `animate-slideUp`.
- **Inspiration found:**
  - **Dialog (Radix/shadcn)** — Proper `DialogHeader`/`DialogFooter` structure, `DialogDescription` for subtitle text, `animate-in`/`animate-out` with zoom-in-95 and fade transitions. Close button uses `Cross2Icon`.
  - **Signup Dialog (Ark UI)** — Compact dialog with icon + title inline in header, `space-y-1` for tight label spacing, `text-xs` for labels.
- **Steal this:** Add a `DialogDescription` subtitle under the title ("Add a new contact to your list"). Use the Radix Dialog animate-in/animate-out pattern for smoother transitions. Consider a phone number format hint below the input.
- **Implementation note:** Add `<p className="text-sm text-zinc-500 mt-1">Add a new contact to your list</p>` below the h2. Add `<p className="text-xs text-zinc-500 mt-1">Include country code (e.g. +54...)</p>` below phone input. These are minor polish items — the existing dialog structure is solid.

### EditContactDialog
- **Status:** Existing — improve
- **Current:** Nearly identical to AddContactDialog but pre-fills values from `contact` prop. Same layout.
- **Inspiration found:** Same as AddContactDialog results.
- **Steal this:** Merge Add and Edit into a single reusable `ContactFormDialog` component that accepts an optional `contact` prop to determine mode. Reduces code duplication.
- **Implementation note:** Create `ContactFormDialog` with `mode: "add" | "edit"` derived from whether `contact` prop exists. Title changes based on mode. Reduces ~120 lines of duplicated dialog code to one component.

### DeleteConfirmDialog
- **Status:** Existing — improve
- **Current:** Centered destructive dialog with `AlertTriangle` icon in red circle, count-aware text, cancel/delete buttons. Clean and functional.
- **Inspiration found:**
  - **Delete Project Dialog (Origin UI)** — Type-to-confirm pattern: user must type the name to enable the delete button. `CircleAlert` icon in a bordered circle, centered layout.
  - **NativeDelete Button** — Animated delete with Framer Motion: first click expands to "Confirm", second click deletes, with a cancel X button that appears. Icon transitions between Trash2 and Check.
  - **Delete Confirmation Popover** — Popover-based (not modal) confirmation with destructive styling, warning box in `bg-destructive/10`.
- **Steal this:** Keep the current modal pattern (simpler for our case) but add a subtle warning box: `<div className="bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 text-xs text-red-400">` listing what will be deleted. For bulk deletes (>5), consider the type-to-confirm pattern.
- **Implementation note:** Add a conditional warning for bulk deletes: `{count > 5 && <div className="...">This is a bulk operation affecting {count} records.</div>}`. Keep simple for single deletes.

### UploadContactsPage
- **Status:** Existing — improve
- **Current:** File input with CSV format instructions, import button, results grid showing added/duplicates/errors with colored stat boxes. Functional but the upload area is a plain `<input type="file">`.
- **Inspiration found:**
  - **File Upload (motion)** — Gorgeous drag-and-drop zone with `UploadCloud` icon that bounces when dragging, blue ring glow on drag, animated file list with progress bars that transition from blue to emerald on completion. `CheckCircle` badge on completed files.
  - **File Upload (shadcn)** — Simpler dashed border upload zone with icon, file preview card showing filename + size + status in a `bg-muted` container with X remove button.
  - **File Uploader** — Drag-and-drop with isDragging state toggle, file preview with thumbnail or generic icon, progress bar simulation.
- **Steal this:** Replace the plain `<input type="file">` with a drag-and-drop zone. Dashed border container with `UploadCloud` icon, "Drag & drop your CSV here, or browse" text. On file selected, show a file preview card with the CSV icon, filename, and size. Keep the existing batch import logic.
- **Implementation note:** Add a `<div onDragOver/onDrop>` wrapper with `border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/50 transition-colors`. Hide the `<input>` and trigger it on click. Show the file preview in a compact card below the drop zone when a file is selected.

---

## Batch 3 — WhatsApp & Messaging

### SetupWhatsAppPage
- **Status:** Existing — improve
- **Current:** Centered card with phone icon, title, description, and "Create Instance" button. Simple onboarding step.
- **Inspiration found:**
  - **Onboarding Checklist** — Checklist with numbered steps, helper links, embedded video tutorial. Progressive disclosure with checkmarks.
- **Steal this:** Add numbered steps showing the full setup flow: 1. Create instance (current step), 2. Scan QR code, 3. Start messaging. Show current step highlighted. Gives users context of what's coming next.
- **Implementation note:** Add a simple `<ol>` above the card with 3 steps styled as `flex gap-4` horizontal pills. Step 1 active (`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`), steps 2-3 inactive (`text-zinc-500 border-zinc-800`). Each pill: number + label.

### ConnectWhatsAppPage
- **Status:** Existing — improve
- **Current:** QR code display in a 264px box, instructions, refresh button, "Waiting for connection..." pulse indicator. Polls every 5 seconds.
- **Inspiration found:**
  - **QR Code Generator** — Card-based QR display with CardHeader/CardContent structure, loading skeleton (`animate-pulse`), download button, size display.
  - **QR Code (Ark UI)** — Clean minimal QR with `bg-white` container, rounded border, padding for scannability.
  - **QR Code with URL** — Icon + title + description header, QR in white padded container with `shadow-lg`, URL display below with `ExternalLink` icon, instructional text.
- **Steal this:** Add a white background padding around the QR for better scannability (`bg-white p-4 rounded-lg` inside the dark container). Add the step indicator from SetupWhatsAppPage showing step 2 is active. Add a skeleton loading placeholder while QR loads instead of just a spinner.
- **Implementation note:** Wrap the `<img>` in `<div className="bg-white rounded-lg p-4">` so the QR has proper contrast. Add `{isLoadingQr && <div className="w-full h-full bg-zinc-700 animate-pulse rounded-lg" />}` as the loading state.

### SendMessagePage
- **Status:** Existing — improve
- **Current:** Contact selector (native `<select>`), textarea for message, MediaUpload component, send button. Functional but the native select looks out of place.
- **Inspiration found:**
  - **Composer Input** — Rich text area with top toolbar (bold/italic/underline), bottom action bar (attach, mic, image, AI), attachment grid preview with remove buttons, "Send" button with `CornerDownLeft` icon. Full featured.
  - **Email Client Card** — Message display with avatar, sender info, reactions, reply input. Good for showing sent message previews.
- **Steal this:** Replace native `<select>` with a searchable combobox/dropdown. Add a WhatsApp-style message preview panel showing how the message will look. Keep the composer simple (no rich text — WhatsApp is plain text) but improve the visual styling.
- **Implementation note:** Replace `<select>` with a custom dropdown: `<div className="relative">` with an input that filters contacts on type, dropdown list below. Add a preview panel to the right (on desktop) or below (on mobile) showing the message in a WhatsApp-style chat bubble: `<div className="bg-emerald-600/20 rounded-lg rounded-tr-none p-3 max-w-xs">`.

### MediaUpload
- **Status:** Existing — improve
- **Current:** File input with accepted types validation, file preview row with media icon + filename + size + upload/uploaded status + remove button. Two-step: select then click "Upload".
- **Inspiration found:**
  - **File Upload (motion drag-drop)** — Drag-and-drop with animated progress bars, file thumbnails for images, CheckCircle completion indicator.
  - **Upload Input** — Split card with image preview on left and file info on right, drag-and-drop support, progress bar overlay.
- **Steal this:** Add drag-and-drop support to the media upload. Show image thumbnails for image files. Auto-upload on file selection (remove the manual "Upload" button step).
- **Implementation note:** Wrap in a drop zone div. For image files, use `URL.createObjectURL(file)` to show a small thumbnail preview. Auto-trigger upload on file selection instead of requiring a separate button click.

---

## Batch 4 — Campaigns (pending — define patterns)

### BulkCampaignPage
- **Status:** Pending — Phase 4
- **Inspiration found:**
  - **Multi-step Form (stepper)** — Numbered step indicators at top, sections revealed progressively, validation per step before advancing.
  - **Composer Input** — Rich compose area with toolbar and attachment grid.
- **Steal this:** Use a multi-step layout with 3 steps: 1. Recipients, 2. Message, 3. Review & Send. Step indicator at top. Each step is a card section. "Next" / "Back" buttons at bottom. Review step shows a summary of everything before the final "Start Campaign" button.
- **Implementation note:** Use `useState<1|2|3>(1)` for current step. Render conditionally: step 1 = RecipientSelector, step 2 = MessageTemplateEditor + MediaUpload + DelayConfig, step 3 = summary card with all settings + "Start Campaign" CTA. Step bar: `<div className="flex gap-2">` with 3 circles connected by lines.

### CampaignStatusPage
- **Status:** Pending — Phase 4
- **Inspiration found:**
  - **Progress (Radix)** — Linear progress bar with `translateX` animation, clean `h-1.5 rounded-full bg-secondary` track with `bg-primary` indicator.
  - **ProgressCircle** — SVG circle progress for a more visual ETA indicator.
  - **Progress with status** — Status message updates based on progress percentage ("Downloading assets...", "Finalizing...").
- **Steal this:** Use a large linear progress bar with percentage + status message below. Add a 3-column stat grid: Sent (emerald), Failed (red), Remaining (zinc). Add ETA using a simple time calculation. Stop button should be red/destructive styled.
- **Implementation note:** Layout: progress bar at top, stats grid below, message log at bottom. Use `<progress>` element or a custom div bar. Stats use the same colored card pattern as the CSV import results.

### RecipientSelector
- **Status:** Pending — Phase 4
- **Inspiration found:**
  - **Radio Group (Radix)** — Clean radio with `Circle` fill indicator, `grid gap-2` layout, accessible with proper labeling.
  - **Radio Button (cosmic)** — Styled radio with colored borders per option, animated ring on selection, bold label when selected.
- **Steal this:** Use radio cards (not just radio buttons). Each option is a clickable card with icon + label + count: "All Contacts (150)", "Pending Only (45)", "Select Manually". When "Select Manually" is chosen, reveal a checkbox list of contacts below.
- **Implementation note:** Radio card pattern: `<label className="flex items-center gap-3 p-4 rounded-lg border border-zinc-800 cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/5">` wrapping a hidden radio input + icon + label + count badge.

### MessageTemplateEditor
- **Status:** Pending — Phase 4
- **Inspiration found:**
  - **Composer Input** — Textarea with toolbar buttons above.
  - **UltraQualityEmailBuilder** — Drag-and-drop blocks with editable content, Tailwind style input. Good for complex builders.
- **Steal this:** Simple textarea with token insertion buttons above it (`{name}`, `{phone}`) and a live preview panel alongside. Keep it simple — no rich text, no drag-and-drop blocks.
- **Implementation note:** Layout: `<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">`. Left: textarea with token buttons above. Right: preview panel showing the message with a sample contact's data substituted in. Token buttons: `<button onClick={() => insertAtCursor("{name}")}>`.

### DelayConfig
- **Status:** Pending — Phase 4
- **Inspiration found:**
  - **Slider (Radix)** — Clean slider with `h-5 w-5` thumb, `h-2` track, `bg-primary` range indicator, tooltip showing value on drag.
  - **Dual Range Slider** — Labels displayed above thumbs, clean Radix primitives.
  - **Slider with Input** — Slider paired with a numeric input field for precise control, reset button.
- **Steal this:** Slider paired with a numeric input. The slider provides quick adjustment (1-30 seconds), the input allows precise typing. Show "5 seconds between messages" label below.
- **Implementation note:** `<div className="flex items-center gap-4">` with `<input type="range" min={1} max={30} />` and `<input type="number" className="w-16" />` synced via state. Add a label: `<p className="text-xs text-zinc-500 mt-1">{delay}s delay between each message</p>`.

---

## Batch 5 — Dashboard (pending — define patterns)

### DashboardPage
- **Status:** Existing shell — Phase 5 rewrite
- **Current:** 4-card grid (WhatsApp status, contacts count, messages sent, quick actions), plus a placeholder welcome message. Basic stat cards with icon + label + value.
- **Inspiration found:**
  - **AnalyticsDashboard** (21st.dev) — 4-column stat grid with mini sparkline charts in each card, change percentage badges (green/red), hover elevation (`hover:-translate-y-1`), header with title + description + "Generate Report" button. Uses Recharts for inline sparklines.
  - **Stats (shadcn)** — Clean stat cards with name + value + change indicator, CardFooter with "View more →" link. Uses `dl` semantic markup.
  - **Incident Analytics** — Rich dashboard with funnel chart, metric rows with up/down arrows, CountUp animation for numbers.
- **Steal this:** Keep the current 4-card stat grid — it's the right pattern. Improve it: (1) bigger numbers (text-3xl → text-4xl), (2) icon in a colored circle for each card, (3) hover lift (`hover:-translate-y-0.5 transition-transform`). Below the grid, add a 2-column layout: left = RecentMessages list, right = QuickActions + ConnectionStatus. Skip sparklines (no time-series data in Convex).
- **Implementation note:** CountUp is a nice-to-have — defer to Phase 5 polish. The bigger win is layout: replace the placeholder welcome card with actual content (RecentMessages + active campaign progress). Header pattern: keep the existing `<h1>Dashboard</h1>` but add `<p className="text-sm text-zinc-500">Overview of your messaging activity</p>` below.

### StatsCard
- **Status:** Pending — Phase 5
- **Inspiration found:** (same as DashboardPage results)
- **Steal this:** Card with icon in colored background circle (top-left), label (text-sm text-zinc-500), large numeric value, optional change badge. Hover: subtle lift + border color change.
- **Implementation note:** Props: `icon`, `label`, `value`, `change?`, `changeType?: "positive" | "negative"`, `color`. Pattern: `<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all">`.

### ConnectionStatus
- **Status:** Pending — Phase 5
- **Inspiration found:**
  - **Status** (compound) — `Status`/`StatusIndicator`/`StatusLabel` compound component. StatusIndicator has a pinging animation (`animate-ping`) behind a solid dot using absolute positioning. Group-based status coloring: `group-[.online]:bg-emerald-500`.
  - **StatusBadge** — Split badge with left icon + label and right icon + label separated by a divider line. Uses `cva` for variant styling.
  - **BadgeDot** — Simple `size-1.5 rounded-full bg-[currentColor] opacity-75` dot pattern.
- **Steal this:** Use the ping animation pattern for the connected state — a pulsing emerald dot behind the solid dot. For disconnected, use a static red dot. Wrap in a Badge-like container.
- **Implementation note:** `<span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></span>` for connected. Static `bg-red-500` for disconnected. Wrap with label in a `flex items-center gap-2` container.

### RecentMessages
- **Status:** Pending — Phase 5
- **Steal this:** Simple list with avatar/icon placeholder, contact name, truncated message preview, relative timestamp ("2m ago"). Separator between items. "View all" link at bottom.
- **Implementation note:** `<ul className="divide-y divide-zinc-800">` with list items showing `<div className="flex items-center gap-3 py-3">`. Use `<span className="text-xs text-zinc-500">` for timestamps. Truncate message with `truncate max-w-[200px]`.

### QuickActions
- **Status:** Pending — Phase 5
- **Steal this:** Horizontal button group or card grid with icon + label for each action. Link to /send, /campaigns, /contacts. Use outline/ghost button style to not compete with the primary content.
- **Implementation note:** `<div className="flex gap-3">` with `<Link>` buttons: `className="flex items-center gap-2 px-4 py-3 bg-zinc-800/50 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors"`.

---

## Batch 6 — Polish (pending — define patterns)

### LandingPage
- **Status:** Pending — Phase 6
- **Inspiration found:**
  - **SaaS Template** — Full dark landing with fixed navbar (logo + nav links + sign in/up), hero section with announcement badge ("New version!"), gradient text heading, subtitle, single CTA, dashboard screenshot with glow effect behind it.
  - **Hero Landing Page (Turing)** — Video background hero, massive headline (80px), subtitle, dual CTAs (primary gradient + ghost), stat counters (40+ Industries, 3M+ Professionals).
  - **HeroSection Enterprise** — Clean hero with feature badge (Zap icon + "Enterprise Grade"), heading with colored span, subtitle, dual CTAs (primary + outline), trust line below.
- **Steal this:** Dark background with the SaaS Template pattern. Announcement badge at top ("Now with WhatsApp Business API"). Large gradient-text heading. Two CTAs: "Get Started" (emerald gradient) + "Learn More" (ghost). Dashboard screenshot below with glow effect. Trust badges or stats section.
- **Implementation note:** Structure: `<section className="min-h-screen flex flex-col items-center justify-center px-6 py-20">`. Badge: `<aside className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-700 bg-zinc-800/50">`. Heading: `style={{ background: "linear-gradient(to bottom, #fff, rgba(255,255,255,0.6))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}`. Dashboard screenshot: place below with absolute glow `bg-emerald-500/20 blur-3xl` behind it.

### NotFoundPage
- **Status:** Pending — Phase 6
- **Inspiration found:**
  - **404 Page Not Found** — SVG illustration (animated GIF from Dribbble), large "404" heading, "Look like you're lost" subtitle, "Go to Home" button.
  - **404 Page (minimal)** — SVG tree/plant illustration, "Page Not Found" text, subtitle, "Return Home" button with arrow icon.
  - **Error 404 Page** — SVG wave background, large "404" in white, friendly message, "Return Home" link.
- **Steal this:** Keep it simple. Large "404" heading, friendly subtitle ("This page wandered off"), emerald "Go Home" button. Optional: a simple Lucide icon composition (MessageSquare + a question mark) instead of a heavy SVG illustration.
- **Implementation note:** `<div className="flex flex-col items-center justify-center min-h-[60vh] text-center">`. `<h1 className="text-8xl font-bold text-zinc-700 mb-4">404</h1>`. `<p className="text-xl text-zinc-400 mb-8">This page doesn't exist</p>`. `<Link to="/dashboard" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg">Go Home</Link>`.

### ErrorBoundary
- **Status:** Pending — Phase 6
- **Steal this:** Centered error card with red-tinted icon, "Something went wrong" heading, error message (if available), "Try again" button that calls `this.setState({ hasError: false })`.
- **Implementation note:** Class component with `componentDidCatch`. Fallback UI: same card pattern as DeleteConfirmDialog but with `AlertTriangle` in red and a retry button.

### LoadingSkeleton
- **Status:** Pending — Phase 6
- **Inspiration found:** Skeleton components use `animate-pulse` on `bg-zinc-800` rounded shapes mimicking the layout they replace. Key pattern: match the exact dimensions of the content being loaded.
- **Steal this:** Create skeletons that match each page's layout. Table skeleton = header bar + 5 rows of alternating width bars. Card skeleton = icon circle + 2 text bars. Use `bg-zinc-800 animate-pulse rounded`.
- **Implementation note:** `<div className="bg-zinc-800 animate-pulse rounded-lg h-4 w-32" />` for text lines. `<div className="bg-zinc-800 animate-pulse rounded-full h-10 w-10" />` for icons. Create `SkeletonTable`, `SkeletonCard`, `SkeletonPage` variants.

### MobileNav
- **Status:** Pending — Phase 6
- **Inspiration found:** SaaS Template Navigation — hamburger/X toggle, slide-down menu with `animate-[slideDown_0.3s]`, nav links + sign in/up in a vertical stack, `bg-black/95 backdrop-blur-md` overlay.
- **Steal this:** Hamburger icon that toggles to X, slide-down panel with vertical nav links + logout button. Use the same nav items from the sidebar.
- **Implementation note:** `<Sheet>` pattern (if using shadcn later) or a simple `{mobileOpen && <div className="md:hidden fixed inset-0 top-16 bg-zinc-950/95 backdrop-blur-md z-40">}` with vertical link stack inside.

### ResponsiveContactTable
- **Status:** Pending — Phase 6
- **Steal this:** On mobile (<768px), render contacts as cards instead of table rows. Each card shows name, phone (monospace), status badge, and action buttons in a compact vertical layout.
- **Implementation note:** Use `useMediaQuery` or Tailwind `md:hidden`/`hidden md:block` to switch between ContactTable and a card-based layout. Card: `<div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2">` with name + status on first row, phone on second, actions on third.

---

## Cross-Cutting Recommendations

### 1. shadcn/ui adoption strategy (Phase 5+)

Don't install shadcn/ui mid-phase. The current custom components are functional
and consistent. When Phase 5 (Dashboard rewrite) begins, introduce shadcn primitives:

| Primitive | Replaces | Why bother |
|-----------|----------|------------|
| Dialog | Custom modal overlay | Focus trap, Esc handling, animate-in/out, `DialogDescription` for a11y |
| Badge | Custom status `<span>` | Variant system, consistent sizing, theme-aware |
| Progress | Custom progress bar | Radix `translateX` animation, accessible `progressbar` role |
| Skeleton | Custom `animate-pulse` divs | Standardized shapes, consistent timing |
| Slider | `<input type="range">` | Thumb styling, tooltip on drag, dual-value |
| RadioGroup | Custom radio inputs | Keyboard navigation, Radix accessibility |

**Don't install:** Button, Input, Label — the current custom classes are fine
and introducing shadcn primitives for these would mean touching every file.

### 2. Animation strategy

**Tier A — CSS only (now, zero dependencies):**
- `transition-colors duration-150` on all interactive elements (already done)
- `animate-pulse` for skeletons and loading states (already done)
- `animate-ping` for ConnectionStatus indicator (new, CSS-only)
- Active nav `border-b-2` transition (new, CSS-only)

**Tier B — framer-motion (Phase 5+, when adding it won't feel premature):**
- Login/Register card entrance (`motion.div`, opacity+y)
- Dialog open/close (zoom-in-95 + fade)
- File upload drop zone (scale on drag)
- Campaign progress number counting (spring animation)

**Don't install framer-motion just for login animations.** Wait until you have
3+ components that need orchestrated motion. Until then, CSS `@keyframes` is fine.

### 3. Bundle considerations

| Package | Size | When to add | Why wait |
|---------|------|-------------|----------|
| framer-motion | ~32KB gzip | Phase 5 | Only 2 components benefit now |
| react-countup | ~4KB gzip | Phase 5 | Only dashboard uses it |
| @tanstack/react-table | ~14KB gzip | Never | Convex handles pagination server-side; simple sort is cheaper than a table library |
| @radix-ui/* | ~2-4KB each | Phase 5 | shadcn dependency, install together |

### 4. Design tokens (already defined above)

See **Design System Foundation** section at the top. Every "steal this" pattern
in this document should be filtered through those tokens. If an inspiration uses
`rounded-2xl` but our system uses `rounded-xl` for cards — use `rounded-xl`.

### 5. What NOT to do

- **Don't add social login buttons** to LoginPage/RegisterPage — we use email/password via Convex Auth. The inspiration showed them but they're irrelevant.
- **Don't add rich text formatting** to SendMessagePage — WhatsApp is plain text. The Composer Input inspiration is for email/chat apps.
- **Don't split Name into first/last** on RegisterPage — the Convex auth profile callback uses a single `name` field. Splitting it means changing the schema for no user benefit.
- **Don't add sparkline charts** to dashboard stat cards — we don't have time-series data from Convex. Show the number, not a fake chart.
- **Don't replace the current "Load more" with numbered pagination** — Convex `usePaginatedQuery` is cursor-based, not offset-based. "Load more" is the correct pattern. Improve its visual treatment instead.
