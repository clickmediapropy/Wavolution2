# UI Inspiration Map — Message Hub

Complete inspiration guide for all pages and components in the project.
Source: 21st.dev, web search, and design patterns research.

---

## Batch 1 — Auth & Layout

### AppLayout
- **Status:** Existing — improve
- **Current:** Navbar with Lucide icons, auth-aware logout, footer, Sonner toasts
- **Inspiration found:**
  - **Dashboard with Collapsible Sidebar** by uniquesonu (21st.dev) — Collapsible sidebar with icon-only mode, dark mode toggle, smooth transitions
  - **Modern sideBar** by uniquesonu (21st.dev) — Collapsible states using framer-motion, tooltips in collapsed mode
- **Steal this:** Add collapsible sidebar with icon-only compact mode that animates smoothly using framer-motion. Use tooltips when collapsed.
- **Implementation note:** Add `collapsed` state to AppLayout. Use `AnimatePresence` for smooth width transitions. Add `group-hover` tooltips for nav items when collapsed.

### LoginPage
- **Status:** Existing — improve
- **Current:** Email/password login with gradient button, background glow, framer-motion entrance
- **Inspiration found:**
  - **Background Gradient Animation** by aceternity (21st.dev) — Animated mesh gradient background with smooth color transitions
  - **Animated Gradient Button** by chowlol202 (21st.dev) — Button with animated gradients, hover/tap interactions, dark mode support
- **Steal this:** Add animated mesh gradient background behind the login card for more visual depth.
- **Implementation note:** Use CSS `background: radial-gradient()` with `animation: pulse 8s ease-in-out infinite`. Keep the existing gradient button but add a subtle glow effect on focus.

### RegisterPage
- **Status:** Existing — improve
- **Current:** Name/email/password with gradient button, password strength indicator, framer-motion
- **Inspiration found:**
  - Same as LoginPage for gradient background consistency
  - **Animated Gradient With SVG** by danielpetho (21st.dev) — SVG-based animated gradients for premium feel
- **Steal this:** Maintain visual consistency with LoginPage but add floating form labels that animate on focus.
- **Implementation note:** Use `peer-placeholder-shown` Tailwind classes for floating labels. Keep existing password strength indicator but animate the strength bar width with framer-motion.

### LandingPage
- **Status:** Existing — improve
- **Current:** Announcement badge, gradient heading, dashboard mockup, features grid, login/register CTAs
- **Inspiration found:**
  - **Hero Landing Page** by minhxthanh (21st.dev) — Dark theme with video background, striking visuals
  - **Enterprise-Ready Landing Page Hero** by uniquesonu (21st.dev) — Bold headline, subtext, dual CTAs, theme-aware
  - **Light Theme Waitlist Landing Page** by muhammad-binsalman (21st.dev) — Countdown timer, waitlist signup
- **Steal this:** Add subtle animated gradient mesh background to hero section + floating mockup elements that respond to scroll.
- **Implementation note:** Use `framer-motion` for parallax scroll effects on the dashboard mockup. Add `whileInView` animations for the features grid.

### NotFoundPage
- **Status:** Existing — improve
- **Current:** 404 illustration + "Go Home" link
- **Inspiration found:**
  - **404 Page Error 3D Template** by SlideFactory — 3D illustrations, multiple themes
  - **Page Not Found Template Set** by wowomnom — Simplified stroke design, bright colors
- **Steal this:** Add a playful animated illustration (Lottie or SVG) with a "Take me home" floating button.
- **Implementation note:** Use `lucide-react` icons arranged creatively or embed a Lottie animation. Add `framer-motion` bounce effect to the CTA button.

### ErrorBoundary
- **Status:** Existing — improve
- **Current:** Catches React rendering errors, shows fallback with retry button
- **Inspiration found:**
  - **Empty States** pattern from 21st.dev — Friendly illustrations when things go wrong
- **Steal this:** Design a friendly "Oops" illustration with clear error messaging and actionable retry/report buttons.
- **Implementation note:** Use a two-column layout: illustration on left, error details + actions on right. Include `console.error` details in a collapsible section.

---

## Batch 2 — Contacts & Data

### ContactsPage
- **Status:** Existing — improve
- **Current:** ContactTable with count badge, status filter chips, sortable columns, bulk delete
- **Inspiration found:**
  - **Data Table From Scratch** by morewings — Dark theme, column pinning, advanced sorting/filtering
  - **Laravel Livewire Tables** — Sortable, searchable, filterable columns pattern
- **Steal this:** Add column visibility toggle (show/hide columns) and saved filter presets.
- **Implementation note:** Use localStorage to persist column visibility and filter preferences. Add a dropdown menu for column toggles in the table header.

### ContactTable
- **Status:** Existing — improve
- **Current:** Paginated table with search, select, sortable columns, status filter chips, bulk actions
- **Inspiration found:**
  - **TanStack Table** patterns — Virtualization for 50k+ rows, sticky headers, column resizing
  - **Data Table Components** on 21st.dev — 30+ table components with sorting and filtering
- **Steal this:** Add column resizing handles and row virtualization for performance with large datasets.
- **Implementation note:** Use `@tanstack/react-table` with `react-window` for virtualization. Add `resize` cursor handles between column headers.

### ContactFormDialog
- **Status:** Existing — improve
- **Current:** Unified add/edit contact dialog with subtitle for mode indication
- **Inspiration found:**
  - **Dialog/Modal Components** on 21st.dev — 37+ modal patterns with focus trapping
- **Steal this:** Add slide-in animation from right (drawer-style) on desktop, full-screen modal on mobile.
- **Implementation note:** Use `framer-motion` for enter/exit animations. Use `Sheet` component pattern for the slide-in effect.

### DeleteConfirmDialog
- **Status:** Existing — improve
- **Current:** Type-to-confirm destructive action dialog
- **Inspiration found:**
  - **Destructive Actions** pattern — Red accents, clear warnings, irreversible action indicators
- **Steal this:** Add a shaking animation when user types incorrectly and a 3-second countdown before enabling the delete button.
- **Implementation note:** Use `framer-motion` shake animation (`x: [-10, 10, -10, 10, 0]`). Add `setTimeout` for the countdown delay.

### UploadContactsPage
- **Status:** Existing — improve
- **Current:** StepIndicator, drag-drop zone, CSV preview table, confirm upload
- **Inspiration found:**
  - **File Upload** by anubra266 (21st.dev) — Drag & drop with files table, upload progress
  - **Dropzone** by haydenbleasel (21st.dev) — Clean drag-and-drop with visual feedback
- **Steal this:** Add upload progress bars for each file and a "recent uploads" history section.
- **Implementation note:** Use `framer-motion` for the drop zone scale effect (already implemented). Add individual progress indicators using `HTML5 FileReader` with `onprogress` events.

### SearchableCombobox
- **Status:** Existing — improve
- **Current:** Searchable dropdown combobox with WhatsApp number display
- **Inspiration found:**
  - **Select Components** on 21st.dev — 62+ select patterns with search
  - **Command Palette** patterns — Fuzzy search, keyboard navigation
- **Steal this:** Add fuzzy search (fuse.js) and keyboard navigation (arrow keys + Enter to select).
- **Implementation note:** Integrate `fuse.js` for fuzzy matching. Add `onKeyDown` handlers for arrow key navigation with visual highlight.

### StepIndicator
- **Status:** Existing — improve
- **Current:** Multi-step wizard progress indicator with emerald active styling
- **Inspiration found:**
  - **Multi-step Wizard** by dhileepkumargm (21st.dev) — Responsive design, visual step indicator
  - **Wizard Progress Navigator** patterns — Connected steps with animation
- **Steal this:** Add connector lines between steps that animate (fill progress) when advancing.
- **Implementation note:** Use `framer-motion` `layoutId` for smooth step indicator movement. Animate connector line width from 0% to 100% between active steps.

---

## Batch 3 — WhatsApp & Messaging

### WhatsAppPage
- **Status:** Existing — improve
- **Current:** Smart rendering: setup form / QR code scanner / connected management. Multi-instance support
- **Inspiration found:**
  - **Integrations Component** by meschacirung (21st.dev) — Connection status, provider cards
  - **Connection patterns** — Green/red status indicators with refresh actions
- **Steal this:** Add animated connection status transitions and a connection health graph (last 24h).
- **Implementation note:** Use `recharts` or simple SVG sparklines for health graph. Animate status dot with `animate-pulse` when connecting.

### SendMessagePage
- **Status:** Existing — improve
- **Current:** SearchableCombobox for contacts, MessageTemplateEditor, MediaUpload, MessagePreview
- **Inspiration found:**
  - **MessageInput** from Stream Chat SDK — Composer with attachments, emoji picker, typing indicators
  - **Textarea Components** on 21st.dev — 22+ textarea patterns with auto-resize
- **Steal this:** Add emoji picker and mention autocomplete (@contact) in the message composer.
- **Implementation note:** Use `emoji-picker-react` for emoji support. Add `@mention` detection with a dropdown of matching contacts.

### MediaUpload
- **Status:** Existing — improve
- **Current:** Drag-drop file upload with framer-motion scale animations, type/size validation
- **Inspiration found:**
  - **File Upload** by preetsuthar17 (21st.dev) — Interactive and animated with progress animations
  - **Dropzone** by haydenbleasel (21st.dev) — Upload files with visual feedback
- **Steal this:** Add thumbnail previews for images/videos with a remove button on hover.
- **Implementation note:** Use `URL.createObjectURL()` for instant previews. Add `framer-motion` layout animations for the grid of thumbnails.

### MessagePreview
- **Status:** Existing — improve
- **Current:** Live preview of composed message with personalization tokens
- **Inspiration found:**
  - **Message bubbles** from chat UI patterns — WhatsApp-style message bubbles with timestamps
- **Steal this:** Make the preview look exactly like a WhatsApp message bubble (green for sent, white for received).
- **Implementation note:** Use Tailwind classes: `bg-emerald-500 text-white rounded-2xl rounded-tr-sm` for sent messages. Add a "delivered" checkmark icon.

### MessageTemplateEditor
- **Status:** Existing — improve
- **Current:** Textarea with `{name}`/`{phone}` token buttons and live preview panel
- **Inspiration found:**
  - **Rich text editors** with variable insertion — Token pills inside the textarea
- **Steal this:** Replace plain `{name}` tokens with styled "pills" that can be clicked to remove.
- **Implementation note:** Use `contentEditable` with styled spans for tokens, or overlay a positioned div on top of textarea. Add `onClick` to pills for removal.

---

## Batch 4 — Campaign System

### BulkCampaignPage
- **Status:** Existing — improve
- **Current:** RecipientSelector, MessageTemplateEditor, MediaUpload, DelayConfig, start campaign
- **Inspiration found:**
  - **Campaign builder patterns** — Multi-step forms with progress, section validation
  - **Form wizard** patterns — Step-by-step with validation per step
- **Steal this:** Convert to a true multi-step wizard with validation before allowing next step.
- **Implementation note:** Use `react-hook-form` with step validation. Add `framer-motion` page transitions between steps.

### CampaignStatusPage
- **Status:** Existing — improve
- **Current:** Real-time progress bar, sent/failed/remaining counts, ETA, stop button
- **Inspiration found:**
  - **Progress Card** by lavikatiyar (21st.dev) — Animated progress bar with icon, customizable labels
  - **alive-progress** library — Real-time throughput, ETA, cool animations
- **Steal this:** Add a live throughput graph showing messages/minute and estimated completion time.
- **Implementation note:** Use `recharts` AreaChart for throughput visualization. Update ETA calculation based on recent sending speed.

### CampaignHistoryPage
- **Status:** Existing — improve
- **Current:** Campaign list with status badges, links to individual campaign status
- **Inspiration found:**
  - **Activity feed patterns** — Timeline view with status indicators
  - **History/Logs components** on 21st.dev — Sortable, filterable lists
- **Steal this:** Add a timeline view option (toggle between table and timeline) and filtering by date/status.
- **Implementation note:** Use `framer-motion` layout animations when switching views. Add date range picker for filtering.

### RecipientSelector
- **Status:** Existing — improve
- **Current:** Radio group (all/pending/selected) + optional contact checkboxes
- **Inspiration found:**
  - **Radio Groups** on 21st.dev — 22+ patterns with custom styling
  - **Audience selector patterns** — Segmented controls with counts
- **Steal this:** Add recipient count badges next to each option and a search/filter within the "selected" view.
- **Implementation note:** Use `badge` component pattern for counts. Add `fuse.js` search for filtering the selected contacts list.

### DelayConfig
- **Status:** Existing — improve
- **Current:** Slider/input for delay between messages (default: 5s)
- **Inspiration found:**
  - **Sliders** on 21st.dev — 45+ slider patterns with labels and tooltips
  - **Slider patterns** — Range inputs with value labels, step markers
- **Steal this:** Add preset buttons (Fast: 1s, Normal: 5s, Slow: 10s, Custom) alongside the slider.
- **Implementation note:** Use segmented control for presets, slider appears when "Custom" is selected. Add tooltip showing current value on slider thumb.

---

## Batch 5 — Dashboard Components

### DashboardPage
- **Status:** Existing — improve
- **Current:** 4 StatsCards grid (animated countup), ConnectionStatus card, RecentMessages list, QuickActions
- **Inspiration found:**
  - **Analytics Dashboard** patterns — Grid layouts, widget system
  - **Dashboard Components** on 21st.dev — 30+ dashboard patterns
- **Steal this:** Add draggable widget reordering and a "compact" vs "comfortable" density toggle.
- **Implementation note:** Use `@dnd-kit/sortable` for drag-and-drop. Store layout preference in localStorage.

### StatsCard
- **Status:** Existing — improve
- **Current:** Stat card with Lucide icon, label, animated numeric value (react-countup)
- **Inspiration found:**
  - **Statistics Card 13** by sean0205 (21st.dev) — Key metrics with unique layouts, data visualizations
  - **Stats Card** by kavikatiyar (21st.dev) — Animated activity stats with bar chart
  - **Animated Dashboard Card** by isaiahbjork (21st.dev) — Hover animations, trend indicators
- **Steal this:** Add sparkline mini-charts showing trend over last 7 days and percentage change indicators.
- **Implementation note:** Use `recharts` Sparkline component for the mini-chart. Add color-coded arrows (green/red) for positive/negative trends.

### ConnectionStatus
- **Status:** Existing — improve
- **Current:** Green/red dot indicator + status text, links to `/whatsapp`
- **Inspiration found:**
  - **Status indicators** — Pulsing dots, connection strength bars
  - **Integrations Component** by meschacirung (21st.dev) — Connected/disconnected states
- **Steal this:** Add connection health history sparkline (last 24 hours) and reconnect button on error.
- **Implementation note:** Use `recharts` for the sparkline. Animate status change with `framer-motion` color transition.

### RecentMessages
- **Status:** Existing — improve
- **Current:** Last 5 messages — contact names, relative timestamps, dividers, campaign link
- **Inspiration found:**
  - **Activity Feed** patterns — Avatar + content + timestamp layout
  - **List Components** on 21st.dev — Various list layouts with hover effects
- **Steal this:** Add message status icons (sent/delivered/failed) and inline reply action on hover.
- **Implementation note:** Use `lucide-react` for status icons. Add `group-hover` for the reply button visibility.

### QuickActions
- **Status:** Existing — improve
- **Current:** Button group linking to Send Message, Bulk Send, View Contacts
- **Inspiration found:**
  - **Quick Actions** patterns — Icon buttons with labels, grid layout
  - **Button Groups** on 21st.dev — Various button arrangements
- **Steal this:** Convert to a 2x2 grid of action cards with icons, titles, and descriptions.
- **Implementation note:** Use card-based layout with hover lift effect (`hover:shadow-lg hover:-translate-y-1`).

### LoadingSkeleton
- **Status:** Existing — improve
- **Current:** Skeleton shimmer loading states for pages
- **Inspiration found:**
  - **Skeleton Shimmer** on Motion.dev — AnimateView transitions from skeleton to content
  - **shimmer-from-structure** library — Structure-aware skeleton loaders
- **Steal this:** Use content-aware skeletons that match the layout of the actual content (cards, table rows, etc.).
- **Implementation note:** Create specific skeleton components: `StatsCardSkeleton`, `TableRowSkeleton`, `ContactCardSkeleton`. Use `animate-pulse` with `bg-gray-200`.

---

## Batch 6 — Polish & Extras

### MobileNav
- **Status:** Pending — to build
- **Inspiration found:**
  - **Navigation Menus** on 21st.dev — 11+ mobile navigation patterns
  - **Sheet/Drawer** patterns — Bottom sheet, side drawer
- **Steal this:** Use a bottom sheet drawer for mobile navigation with swipe-to-dismiss.
- **Implementation note:** Use `framer-motion` `drag` prop for swipe gesture. Implement `Sheet` component from scratch or use `@radix-ui/react-dialog`.

### ResponsiveContactTable
- **Status:** Pending — to build
- **Inspiration found:**
  - **Responsive tables** — Card layout on mobile, horizontal scroll
  - **Data Tables** patterns — Collapsible row details on mobile
- **Steal this:** Convert table to card grid on mobile (<640px) with expandable row details.
- **Implementation note:** Use CSS Grid for card layout. Add `useMediaQuery` hook to toggle between table and card views.

---

## Top 5 Global Improvements

### 1. Consistent Animation Language
Use `framer-motion` consistently across all components. Define a `transition` preset object:
```typescript
const transitions = {
  default: { duration: 0.2, ease: "easeOut" },
  spring: { type: "spring", stiffness: 300, damping: 30 },
  slow: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
};
```

### 2. Dark Mode Polish
Ensure all components have proper dark mode contrast. Use CSS variables for theme colors:
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f3f4f6;
  --text-primary: #111827;
}
.dark {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f8fafc;
}
```

### 3. Micro-interactions
Add hover states, focus rings, and active states to all interactive elements:
```typescript
// Button with all states
<button className="
  transition-all duration-200
  hover:shadow-md hover:-translate-y-0.5
  active:translate-y-0
  focus:ring-2 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
">
```

### 4. Loading States
Replace all `Loading...` text with content-aware skeletons. Use `Suspense` boundaries with fallbacks.

### 5. Typography Scale
Establish consistent typography hierarchy:
- Display: 48px/700 (Landing page headlines)
- H1: 32px/700 (Page titles)
- H2: 24px/600 (Section headers)
- H3: 20px/600 (Card titles)
- Body: 16px/400 (Main text)
- Small: 14px/400 (Secondary text)
- Caption: 12px/500 (Labels, timestamps)

---

## External Resources

### 21st.dev Components to Explore
- [Statistics Card 13](https://21st.dev/community/components/sean0205/statistics-card-13)
- [Animated Dashboard Card](https://21st.dev/community/components/isaiahbjork/animated-dashboard-card)
- [Background Gradient Animation](https://21st.dev/aceternity/background-gradient-animation)
- [Animated Gradient Button](https://21st.dev/community/components/chowlol202/animated-gradient-button)
- [Dashboard with Collapsible Sidebar](https://21st.dev/community/components/uniquesonu/dashboard-with-collapsible-sidebar)
- [File Upload](https://21st.dev/community/components/anubra266/file-upload-1)
- [Dropzone](https://21st.dev/community/components/haydenbleasel/dropzone)
- [Multi-step Wizard](https://21st.dev/community/components/dhileepkumargm/multi-step-wizard)
- [Progress Card](https://21st.dev/community/components/lavikatiyar/progress-card)
- [Hero Landing Page](https://21st.dev/community/components/minhxthanh/hero-landing-page)

### Libraries to Consider
- **recharts** — For dashboard sparklines and campaign throughput graphs
- **fuse.js** — For fuzzy search in comboboxes
- **emoji-picker-react** — For message composer emoji support
- **@dnd-kit/sortable** — For draggable dashboard widgets
- **react-window** — For table virtualization with large datasets

---

*Last updated: 2026-03-23*
