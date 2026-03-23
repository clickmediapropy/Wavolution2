# UI Polish + WhatsApp Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all 20 remaining polish items from ui-inspiration.md plus a WhatsApp management page, using shadcn/ui primitives, framer-motion, and react-countup.

**Architecture:** Two-phase approach — Phase 1 installs shadcn/ui and migrates 6 primitives sequentially. Phase 2 launches 4 parallel agents (A–D) on non-overlapping file sets. A dependency install checkpoint gate separates the phases.

**Tech Stack:** shadcn/ui (Radix), framer-motion, react-countup, Convex, React 19, Vite 8, Tailwind v4

**Spec:** `docs/superpowers/specs/2026-03-23-ui-polish-whatsapp-mgmt-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|----------------|
| `src/components/ui/dialog.tsx` | shadcn Dialog primitive |
| `src/components/ui/badge.tsx` | shadcn Badge primitive |
| `src/components/ui/progress.tsx` | shadcn Progress primitive |
| `src/components/ui/skeleton.tsx` | shadcn Skeleton primitive |
| `src/components/ui/slider.tsx` | shadcn Slider primitive |
| `src/components/ui/radio-group.tsx` | shadcn RadioGroup primitive |
| `src/pages/WhatsAppPage.tsx` | Unified WhatsApp management page |
| `src/lib/relativeTime.ts` | Pure function: timestamp → "2m ago" |
| `src/lib/passwordStrength.ts` | Pure function: password → strength 0-4 |

### Modified Files
| File | Change | Owner |
|------|--------|-------|
| `components.json` | shadcn config | Phase 1 |
| `src/lib/utils.ts` | May need shadcn utility updates | Phase 1 |
| `src/components/ContactFormDialog.tsx` | Migrate to shadcn Dialog + add subtitle | Phase 1 → Agent C |
| `src/components/DeleteConfirmDialog.tsx` | Migrate to shadcn Dialog + type-to-confirm | Phase 1 → Agent C |
| `src/components/ContactTable.tsx` | Replace status spans with Badge | Phase 1 |
| `src/pages/CampaignStatusPage.tsx` | Replace progress div with Progress + Badge | Phase 1 |
| `src/components/LoadingSkeleton.tsx` | Replace Pulse with Skeleton | Phase 1 |
| `src/components/DelayConfig.tsx` | Replace range input with Slider | Phase 1 |
| `src/components/RecipientSelector.tsx` | Replace radio inputs with RadioGroup | Phase 1 |
| `src/pages/LoginPage.tsx` | Gradient button, bg decoration, motion | Agent A |
| `src/pages/RegisterPage.tsx` | Gradient button, pw strength, motion | Agent A |
| `src/pages/LandingPage.tsx` | Badge, gradient text, screenshot, trust | Agent A |
| `src/components/AppLayout.tsx` | Add WhatsApp nav item | Agent B |
| `src/App.tsx` | Add /whatsapp route, redirect old routes | Agent B |
| `src/pages/DashboardPage.tsx` | Link ConnectionStatus to /whatsapp | Agent B |
| `src/components/ConnectionStatus.tsx` | Accept optional `href` prop | Agent B |
| `src/components/RecentMessages.tsx` | Names, timestamps, dividers, link | Agent C |
| `src/components/StatsCard.tsx` | CountUp for numeric values | Agent D |
| `src/pages/UploadContactsPage.tsx` | motion wrapper on drop zone | Agent D |
| `src/components/MediaUpload.tsx` | motion wrapper on drop zone | Agent D |

---

## Phase 1: shadcn/ui Foundation

### Task 1: Install and configure shadcn/ui

**Files:**
- Create: `components.json`
- Modify: `src/lib/utils.ts` (if shadcn needs adjustments)
- Modify: `package.json` (new deps)

- [ ] **Step 1: Install shadcn/ui**

Run: `npx shadcn@latest init`

Select when prompted:
- Style: Default
- Base color: Zinc
- CSS variables: Yes

NOTE: The `cn()` utility already exists at `src/lib/utils.ts`. If shadcn tries to overwrite it, keep the existing one (it's identical: `clsx` + `tailwind-merge`).

- [ ] **Step 2: Verify shadcn config**

Check that `components.json` was created with correct paths:
```json
{
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

Run: `npm run check`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components.json src/lib/utils.ts package.json package-lock.json
git commit -m "chore: install and configure shadcn/ui with zinc/emerald dark theme"
```

---

### Task 2: Add shadcn Dialog and migrate ContactFormDialog

**Files:**
- Create: `src/components/ui/dialog.tsx`
- Modify: `src/components/ContactFormDialog.tsx`
- Test: `src/__tests__/components/ContactFormDialog.test.tsx`

- [ ] **Step 1: Add shadcn Dialog component**

Run: `npx shadcn@latest add dialog`

This creates `src/components/ui/dialog.tsx` with Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription.

- [ ] **Step 2: Migrate ContactFormDialog to shadcn Dialog**

Replace the manual overlay in `src/components/ContactFormDialog.tsx`. The current implementation (lines 66-147) uses a `<div className="fixed inset-0 ...">` overlay with a manually styled card. Replace with:

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// In the component return:
return (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ...keep existing form fields exactly as-is... */}
      </form>
    </DialogContent>
  </Dialog>
);
```

Key changes:
- Remove the outer `if (!isOpen) return null;` — Dialog handles visibility
- Remove the manual `<div className="fixed inset-0 ...">` backdrop
- Remove the close `<button>` with X icon — DialogContent includes it
- Keep all form fields, validation, and submit logic unchanged
- DialogContent already has animate-in/animate-out built in

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/__tests__/components/ContactFormDialog.test.tsx`

Tests may need mock adjustments for `@radix-ui/react-dialog`. If tests fail because Radix Dialog uses a portal, add to the test file:

```tsx
// Mock Radix Dialog portal to render inline for testing
vi.mock("@radix-ui/react-dialog", async () => {
  const actual = await vi.importActual("@radix-ui/react-dialog");
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});
```

Expected: All existing ContactFormDialog tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/ContactFormDialog.tsx src/__tests__/components/ContactFormDialog.test.tsx
git commit -m "refactor: migrate ContactFormDialog to shadcn Dialog"
```

---

### Task 3: Migrate DeleteConfirmDialog to shadcn Dialog

**Files:**
- Modify: `src/components/DeleteConfirmDialog.tsx`
- Test: `src/__tests__/components/DeleteConfirmDialog.test.tsx`

- [ ] **Step 1: Migrate DeleteConfirmDialog**

Same pattern as ContactFormDialog. Replace manual overlay with shadcn Dialog. Keep the AlertTriangle icon, warning box for count>5, and all button logic unchanged.

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

return (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
    <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-sm text-center">
      {/* Keep existing icon, heading, description, warning, buttons */}
    </DialogContent>
  </Dialog>
);
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/__tests__/components/DeleteConfirmDialog.test.tsx`
Expected: PASS (with same Radix portal mock if needed)

- [ ] **Step 3: Commit**

```bash
git add src/components/DeleteConfirmDialog.tsx src/__tests__/components/DeleteConfirmDialog.test.tsx
git commit -m "refactor: migrate DeleteConfirmDialog to shadcn Dialog"
```

---

### Task 4: Add shadcn Badge and migrate ContactTable + CampaignStatusPage

**Files:**
- Create: `src/components/ui/badge.tsx`
- Modify: `src/components/ContactTable.tsx`
- Modify: `src/pages/CampaignStatusPage.tsx`

- [ ] **Step 1: Add shadcn Badge**

Run: `npx shadcn@latest add badge`

- [ ] **Step 2: Migrate ContactTable status badges**

In `src/components/ContactTable.tsx`, the current status rendering uses inline `<span>` elements with `statusConfig` colors. Replace with shadcn Badge using custom variants matching the existing colors.

The existing `statusConfig` object defines colors per status. Keep this config but render using Badge:

```tsx
import { Badge } from "@/components/ui/badge";

// Replace the status <span> with:
<Badge
  variant="outline"
  className={`${statusConfig[status]?.bg} ${statusConfig[status]?.text} border-transparent`}
>
  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[status]?.dot} mr-1.5`} />
  {status}
</Badge>
```

- [ ] **Step 3: Migrate CampaignStatusPage status badge**

Same Badge pattern for campaign status display.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/__tests__/components/ContactTable.test.tsx src/__tests__/pages/CampaignStatusPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/badge.tsx src/components/ContactTable.tsx src/pages/CampaignStatusPage.tsx
git commit -m "refactor: migrate status badges to shadcn Badge"
```

---

### Task 5: Add shadcn Progress, Skeleton, Slider, RadioGroup

**Files:**
- Create: `src/components/ui/progress.tsx`, `src/components/ui/skeleton.tsx`, `src/components/ui/slider.tsx`, `src/components/ui/radio-group.tsx`
- Modify: `src/pages/CampaignStatusPage.tsx`, `src/components/LoadingSkeleton.tsx`, `src/components/DelayConfig.tsx`, `src/components/RecipientSelector.tsx`

- [ ] **Step 1: Add remaining 4 shadcn primitives**

Run:
```bash
npx shadcn@latest add progress skeleton slider radio-group
```

- [ ] **Step 2: Migrate CampaignStatusPage progress bar**

Replace the custom `<div>` progress bar with shadcn `<Progress>`:

```tsx
import { Progress } from "@/components/ui/progress";
// Replace the custom progress div:
<Progress value={progressPercent} className="h-3" />
```

- [ ] **Step 3: Migrate LoadingSkeleton**

Replace the custom `Pulse` component with shadcn `<Skeleton>`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";
// Replace: <Pulse className="h-4 w-24" />
// With:    <Skeleton className="h-4 w-24" />
```

Remove the custom `Pulse` function entirely.

- [ ] **Step 4: Migrate DelayConfig slider**

Replace `<input type="range">` with shadcn `<Slider>`:

```tsx
import { Slider } from "@/components/ui/slider";
<Slider
  value={[delay]}
  onValueChange={([val]) => onChange(val)}
  min={MIN_DELAY}
  max={MAX_DELAY}
  step={1}
/>
```

- [ ] **Step 5: Migrate RecipientSelector radio group**

Replace custom radio inputs with shadcn `<RadioGroup>` + `<RadioGroupItem>`:

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// RecipientSelector is a CONTROLLED component — it receives recipientType
// and onRecipientTypeChange as props. Do NOT use local state.
<RadioGroup
  value={recipientType}
  onValueChange={(val) => onRecipientTypeChange(val as RecipientType)}
>
  {options.map(opt => (
    <label key={opt.value} className="flex items-center gap-3 p-4 rounded-lg border ...">
      <RadioGroupItem value={opt.value} />
      {/* ...existing icon + label + count */}
    </label>
  ))}
</RadioGroup>
```

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/ src/pages/CampaignStatusPage.tsx src/components/LoadingSkeleton.tsx src/components/DelayConfig.tsx src/components/RecipientSelector.tsx
git commit -m "refactor: migrate Progress, Skeleton, Slider, RadioGroup to shadcn"
```

---

### Task 6: Dependency install checkpoint

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install framer-motion and react-countup**

Run: `npm install framer-motion react-countup`

- [ ] **Step 2: Verify installation**

Run: `grep -E "framer-motion|react-countup" package.json`
Expected: Both packages listed in dependencies

- [ ] **Step 3: Run full check**

Run: `npm run check && npm test`
Expected: ALL PASS (no code changes, just new deps)

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install framer-motion and react-countup"
```

**GATE: Phase 2 agents can now launch in parallel.**

---

## Phase 2 — Agent A: Auth + Landing Polish

### Task 7: LoginPage gradient button + background decoration + framer-motion

**Files:**
- Modify: `src/pages/LoginPage.tsx`
- Test: `src/__tests__/pages/LoginPage.test.tsx`

- [ ] **Step 1: Add framer-motion import and gradient button**

In `src/pages/LoginPage.tsx`:

1. Add import: `import { motion } from "framer-motion";`
2. Line 29: Replace `animate-fadeInUp` class → remove it (framer-motion replaces it)
3. Wrap the outer `<div>` at line 29 with `<motion.div>`:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
  className="flex items-center justify-center min-h-[80vh]"
>
```

4. Line 89: Replace submit button class:

Old: `bg-emerald-600 hover:bg-emerald-500`
New: `bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-400 hover:from-emerald-500 hover:via-emerald-400 hover:to-emerald-300`

5. Add background decoration. After the opening `<motion.div>`, before `<div className="w-full max-w-md">`, add:

```tsx
{/* Background glow decoration */}
<div
  aria-hidden="true"
  className="pointer-events-none absolute -z-10 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl"
/>
```

Make the motion.div `className` include `relative` so the absolute decoration positions correctly.

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/__tests__/pages/LoginPage.test.tsx`

If tests fail due to framer-motion, add mock:
```tsx
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/pages/LoginPage.tsx src/__tests__/pages/LoginPage.test.tsx
git commit -m "feat: LoginPage gradient button, background glow, framer-motion entrance"
```

---

### Task 8: RegisterPage gradient button + password strength + framer-motion

**Files:**
- Create: `src/lib/passwordStrength.ts`
- Modify: `src/pages/RegisterPage.tsx`
- Test: `src/__tests__/pages/RegisterPage.test.tsx`

- [ ] **Step 1: Create password strength utility**

Create `src/lib/passwordStrength.ts`:

```ts
/**
 * Returns password strength 0-4.
 * 0 = empty, 1 = <6 chars, 2 = 6+ chars,
 * 3 = 6+ with mixed case or numbers,
 * 4 = 8+ with mixed case AND numbers AND special
 */
export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  if (password.length < 6) return 1;

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (password.length >= 8 && hasUpper && hasLower && hasNumber && hasSpecial) return 4;
  if ((hasUpper && hasLower) || hasNumber) return 3;
  return 2;
}

export const STRENGTH_COLORS = [
  "bg-zinc-700",     // 0: empty
  "bg-red-500",      // 1: weak
  "bg-amber-500",    // 2: fair
  "bg-emerald-400",  // 3: good
  "bg-emerald-500",  // 4: strong
] as const;
```

- [ ] **Step 2: Add strength indicator + gradient button + motion to RegisterPage**

In `src/pages/RegisterPage.tsx`:

1. Add imports:
```tsx
import { motion } from "framer-motion";
import { getPasswordStrength, STRENGTH_COLORS } from "@/lib/passwordStrength";
```

2. Inside the component, add: `const strength = getPasswordStrength(password);`

3. Line 38: Replace `animate-fadeInUp` with motion.div wrapper (same as LoginPage)

4. After the password field's `</div>` (line 108), add the strength indicator:

```tsx
{password && (
  <div className="flex gap-1 mt-2">
    {[1, 2, 3, 4].map((level) => (
      <div
        key={level}
        className={`h-1 flex-1 rounded-full transition-colors ${
          strength >= level ? STRENGTH_COLORS[strength] : "bg-zinc-700"
        }`}
      />
    ))}
  </div>
)}
```

5. Line 139: Replace submit button class with gradient (same as LoginPage)

6. Add background glow decoration (same as LoginPage)

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/__tests__/pages/RegisterPage.test.tsx`
Expected: PASS (with framer-motion mock if needed)

- [ ] **Step 4: Commit**

```bash
git add src/lib/passwordStrength.ts src/pages/RegisterPage.tsx src/__tests__/pages/RegisterPage.test.tsx
git commit -m "feat: RegisterPage gradient button, password strength indicator, framer-motion"
```

---

### Task 9: LandingPage announcement badge + gradient heading + screenshot + trust section

**Files:**
- Modify: `src/pages/LandingPage.tsx`
- Test: `src/__tests__/pages/LandingPage.test.tsx`

- [ ] **Step 1: Add announcement badge above heading**

In `src/pages/LandingPage.tsx`, add before the heading (after the icon area, around line 31):

```tsx
<aside className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-700 bg-zinc-800/50 text-sm text-zinc-300">
  <Zap className="w-4 h-4 text-emerald-400" />
  Now with WhatsApp Business API
</aside>
```

Add `Zap` to the lucide-react imports.

- [ ] **Step 2: Gradient-text heading**

Replace the heading at line 33-37:

```tsx
<h1
  className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight"
  style={{
    background: "linear-gradient(to bottom, #fff, rgba(255,255,255,0.6))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  }}
>
  WhatsApp Messaging
  <br />
  at Scale
</h1>
```

- [ ] **Step 3: Add dashboard mockup with glow below CTAs**

After the CTA buttons `</div>` (line 58), add:

```tsx
{/* Dashboard mockup with glow */}
<div className="relative mt-16 max-w-4xl mx-auto">
  <div
    aria-hidden="true"
    className="absolute inset-0 -z-10 bg-emerald-500/20 blur-3xl rounded-full scale-75"
  />
  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
    {/* Fake stat cards */}
    <div className="grid grid-cols-4 gap-3 mb-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-zinc-800 rounded-lg p-3">
          <div className="h-2 w-12 bg-zinc-700 rounded mb-2" />
          <div className="h-4 w-8 bg-zinc-700 rounded" />
        </div>
      ))}
    </div>
    {/* Fake table rows */}
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="flex gap-3 py-2 border-t border-zinc-800">
        <div className="h-3 w-3 bg-zinc-700 rounded-full" />
        <div className="h-3 w-24 bg-zinc-700 rounded" />
        <div className="h-3 w-32 bg-zinc-700 rounded ml-auto" />
      </div>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Add trust/feature section below mockup**

Replace the existing `VALUE_PROPS` section or add below it. Add these feature badges:

```tsx
{/* Features grid */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-16 mb-16">
  {[
    { icon: <Send className="w-5 h-5" />, label: "Bulk Messaging" },
    { icon: <Users className="w-5 h-5" />, label: "CSV Import" },
    { icon: <Megaphone className="w-5 h-5" />, label: "Campaign Tracking" },
    { icon: <MessageSquare className="w-5 h-5" />, label: "WhatsApp API" },
  ].map((feat) => (
    <div
      key={feat.label}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 text-center"
    >
      <div className="text-emerald-400">{feat.icon}</div>
      <span className="text-xs font-medium text-zinc-400">{feat.label}</span>
    </div>
  ))}
</div>
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run src/__tests__/pages/LandingPage.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/pages/LandingPage.tsx src/__tests__/pages/LandingPage.test.tsx
git commit -m "feat: LandingPage announcement badge, gradient heading, dashboard mockup, trust section"
```

---

## Phase 2 — Agent B: WhatsApp Management Page

### Task 10: Create WhatsAppPage with smart rendering

**Files:**
- Create: `src/pages/WhatsAppPage.tsx`

- [ ] **Step 1: Create the unified WhatsApp management page**

Create `src/pages/WhatsAppPage.tsx`:

```tsx
import { useState, useEffect, useCallback } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Smartphone, QrCode, RefreshCw, Loader2, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { StepIndicator } from "@/components/StepIndicator";

const SETUP_STEPS = [
  { label: "Create Instance" },
  { label: "Scan QR Code" },
  { label: "Connected" },
];

export function WhatsAppPage() {
  const user = useQuery(api.users.currentUser);
  const createInstance = useAction(api.evolution.createInstance);
  const getQrCode = useAction(api.evolution.getQrCode);
  const checkStatus = useAction(api.evolution.checkConnectionStatus);
  const deleteInstance = useAction(api.evolution.deleteInstance);

  const [isCreating, setIsCreating] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [qrError, setQrError] = useState("");

  const instanceName = user?.evolutionInstanceName;
  const instanceCreated = user?.instanceCreated ?? false;
  const connected = user?.whatsappConnected ?? false;

  // Determine current step
  const currentStep = connected ? 2 : instanceCreated ? 1 : 0;

  // Fetch QR code
  const fetchQr = useCallback(async () => {
    if (!instanceName) return;
    setIsLoadingQr(true);
    setQrError("");
    try {
      const data = await getQrCode({ instanceName });
      setQrBase64(data.base64 || null);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : "Failed to load QR code");
    } finally {
      setIsLoadingQr(false);
    }
  }, [instanceName, getQrCode]);

  // Auto-fetch QR when in step 1
  useEffect(() => {
    if (instanceCreated && !connected && instanceName) {
      fetchQr();
    }
  }, [instanceCreated, connected, instanceName, fetchQr]);

  // Poll connection status when in step 1
  useEffect(() => {
    if (!instanceName || connected || !instanceCreated) return;
    const interval = setInterval(async () => {
      try {
        const result = await checkStatus({ instanceName });
        if (result.state === "open") {
          toast.success("WhatsApp connected!");
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [instanceName, connected, instanceCreated, checkStatus]);

  // Handle create instance
  const handleCreate = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const shortId = user._id.slice(-8);
      const instanceNameNew = `hub_${shortId}`;
      await createInstance({ instanceName: instanceNameNew });
      toast.success("WhatsApp instance created!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create instance");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!instanceName) return;
    try {
      await deleteInstance({ instanceName });
      toast.success("WhatsApp instance disconnected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect");
    }
  };

  if (user === undefined) {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <Smartphone className="w-7 h-7 text-emerald-500" />
        <h1 className="text-2xl font-bold text-zinc-100">WhatsApp</h1>
      </div>

      <StepIndicator steps={SETUP_STEPS} currentStep={currentStep} />

      <div className="max-w-lg mx-auto">
        {/* Step 0: Create instance */}
        {!instanceCreated && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-2">
              Connect Your WhatsApp
            </h2>
            <p className="text-zinc-400 mb-6">
              Create a WhatsApp instance to start sending messages.
              You&apos;ll scan a QR code with your phone in the next step.
            </p>
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCreating ? "Creating..." : "Create Instance"}
            </button>
          </div>
        )}

        {/* Step 1: Scan QR code */}
        {instanceCreated && !connected && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
            <p className="text-zinc-400 mb-6">
              Open WhatsApp on your phone &rarr; Settings &rarr; Linked Devices
              &rarr; Link a Device &rarr; Scan the code below.
            </p>
            <div className="w-64 h-64 mx-auto mb-6 bg-white rounded-lg p-4 flex items-center justify-center">
              {isLoadingQr ? (
                <div className="w-full h-full animate-pulse bg-zinc-300 rounded-lg" role="status" aria-label="Loading QR code" />
              ) : qrError ? (
                <p className="text-sm text-red-400 px-4">{qrError}</p>
              ) : qrBase64 ? (
                <img src={qrBase64} alt="WhatsApp QR Code" className="w-full h-full object-contain" />
              ) : (
                <p className="text-sm text-zinc-500">No QR code available</p>
              )}
            </div>
            <button
              onClick={fetchQr}
              disabled={isLoadingQr}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingQr ? "animate-spin" : ""}`} />
              Refresh QR Code
            </button>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-zinc-400">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Waiting for connection...
            </div>
          </div>
        )}

        {/* Step 2: Connected — management */}
        {connected && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <Wifi className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">Connected</h2>
                <p className="text-sm text-zinc-500">Your WhatsApp is linked and ready</p>
              </div>
              <span className="ml-auto relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {instanceName && (
                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <span className="text-sm text-zinc-500">Instance</span>
                  <span className="text-sm font-mono text-zinc-300">{instanceName}</span>
                </div>
              )}
              {user?.whatsappNumber && (
                <div className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <span className="text-sm text-zinc-500">Phone</span>
                  <span className="text-sm font-mono text-zinc-300">{user.whatsappNumber}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDisconnect}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <WifiOff className="w-4 h-4" />
                Disconnect
              </button>
              <button
                onClick={async () => {
                  await handleDisconnect();
                  // After disconnect, component re-renders to step 0/1
                  // and the user can reconnect from there
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/WhatsAppPage.tsx
git commit -m "feat: create WhatsAppPage with smart rendering (setup/QR/connected states)"
```

---

### Task 11: Add nav item + route + redirect old routes

**Files:**
- Modify: `src/components/AppLayout.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add WhatsApp nav item to AppLayout**

In `src/components/AppLayout.tsx`:

1. Add `Smartphone` to the lucide-react import (line 11)
2. Remove `as const` from `navItems` (line 21)
3. Add the new item after Send:

```tsx
const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/send", label: "Send", icon: Send },
  { to: "/whatsapp", label: "WhatsApp", icon: Smartphone },
] as const;
```

4. Re-add `as const`

- [ ] **Step 2: Add route and redirect old routes in App.tsx**

In `src/App.tsx`:

1. Add import: `import { WhatsAppPage } from "./pages/WhatsAppPage";`
2. Add import: `import { Navigate } from "react-router-dom";` (if not already imported)
3. Add the new `/whatsapp` route before the `/whatsapp/setup` route:

```tsx
<Route
  path="/whatsapp"
  element={
    <ProtectedRoute>
      <WhatsAppPage />
    </ProtectedRoute>
  }
/>
```

4. Replace the `/whatsapp/setup` and `/whatsapp/connect` routes with redirects:

```tsx
<Route path="/whatsapp/setup" element={<Navigate to="/whatsapp" replace />} />
<Route path="/whatsapp/connect" element={<Navigate to="/whatsapp" replace />} />
```

5. Remove the now-unused imports for `SetupWhatsAppPage` and `ConnectWhatsAppPage`

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/__tests__/components/AppLayout.test.tsx`
Expected: PASS (may need to add "WhatsApp" nav link assertion)

- [ ] **Step 4: Commit**

```bash
git add src/components/AppLayout.tsx src/App.tsx
git commit -m "feat: add WhatsApp nav item, route, and redirect old setup/connect routes"
```

---

### Task 12: Enhance ConnectionStatus on Dashboard

**Files:**
- Modify: `src/components/ConnectionStatus.tsx`
- Modify: `src/pages/DashboardPage.tsx`

- [ ] **Step 1: Add optional href prop to ConnectionStatus**

In `src/components/ConnectionStatus.tsx`, add an `href` prop and wrap the card in a `<Link>` when provided:

```tsx
import { Link } from "react-router-dom";

interface ConnectionStatusProps {
  connected: boolean;
  href?: string;
}

export function ConnectionStatus({ connected, href }: ConnectionStatusProps) {
  const card = (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition-transform hover:-translate-y-0.5 hover:border-zinc-700">
      {/* ...existing content unchanged... */}
    </div>
  );

  if (href) {
    return <Link to={href} className="block">{card}</Link>;
  }
  return card;
}
```

- [ ] **Step 2: Pass href in DashboardPage**

In `src/pages/DashboardPage.tsx` line 27:

```tsx
<ConnectionStatus connected={connected} href="/whatsapp" />
```

- [ ] **Step 3: Run tests**

IMPORTANT: Since ConnectionStatus now imports `Link` from react-router-dom, any test that renders it with `href` must be wrapped in `<MemoryRouter>`. Update `ConnectionStatus.test.tsx`:

```tsx
import { MemoryRouter } from "react-router-dom";

// Wrap renders that pass href:
render(
  <MemoryRouter>
    <ConnectionStatus connected={true} href="/whatsapp" />
  </MemoryRouter>
);
```

Tests that don't pass `href` won't render `<Link>` so they don't need `MemoryRouter`.

Run: `npx vitest run src/__tests__/components/ConnectionStatus.test.tsx src/__tests__/pages/DashboardPage.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ConnectionStatus.tsx src/pages/DashboardPage.tsx src/__tests__/components/ConnectionStatus.test.tsx
git commit -m "feat: link ConnectionStatus card to /whatsapp management page"
```

---

## Phase 2 — Agent C: Component Polish

### Task 13: RecentMessages — contact names, relative timestamps, dividers, link

**Files:**
- Create: `src/lib/relativeTime.ts`
- Modify: `src/components/RecentMessages.tsx`

- [ ] **Step 1: Create relativeTime utility**

Create `src/lib/relativeTime.ts`:

```ts
/** Converts a timestamp to a relative time string like "2m ago", "1h ago", "Yesterday" */
export function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
```

- [ ] **Step 2: Add contacts query and update RecentMessages**

In `src/components/RecentMessages.tsx`:

1. Add imports:
```tsx
import { useQuery, usePaginatedQuery } from "convex/react";
import { Link } from "react-router-dom";
import { relativeTime } from "@/lib/relativeTime";
```

2. Inside the component, add a contacts query to build a phone→name map:
```tsx
const contacts = useQuery(api.contacts.list, { paginationOpts: { numItems: 500, cursor: null } });
const phoneToName = new Map<string, string>();
if (contacts?.page) {
  for (const c of contacts.page) {
    if (c.name) phoneToName.set(c.phone, c.name);
  }
}
```

NOTE: This uses the existing paginated `contacts.list` query (there is NO `listByUserId` function — ignore that name if you see it in the spec). For RecentMessages we just need a reasonable batch.

3. Replace the message list rendering. Change `space-y-2` to `divide-y divide-zinc-800`:

```tsx
<div className="divide-y divide-zinc-800">
  {messages.results.map((msg) => {
    const contactName = phoneToName.get(msg.phone);
    return (
      <div
        key={msg._id}
        className="flex items-center gap-3 px-3 py-3"
      >
        {msg.status === "sent" ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-zinc-300 block truncate">
            {contactName ?? msg.phone}
          </span>
          {contactName && (
            <span className="text-xs font-mono text-zinc-500 block truncate">
              {msg.phone}
            </span>
          )}
        </div>
        <span className="text-xs text-zinc-500 truncate max-w-[30%]">
          {msg.message}
        </span>
        <span className="text-xs text-zinc-600 flex-shrink-0">
          {relativeTime(msg._creationTime)}
        </span>
      </div>
    );
  })}
</div>
```

4. Add "Send new campaign" link after the list:

```tsx
{messages.results.length > 0 && (
  <div className="pt-3 border-t border-zinc-800 mt-1">
    <Link
      to="/campaigns/new"
      className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
    >
      Send new campaign →
    </Link>
  </div>
)}
```

- [ ] **Step 3: Run tests**

The test file uses `vi.mock("convex/react")` — you MUST add `useQuery` to the mock since RecentMessages now calls it:

```tsx
const mockUseQuery = vi.fn();
vi.mock("convex/react", () => ({
  usePaginatedQuery: (...args: any[]) => mockUsePaginatedQuery(...args),
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

// In beforeEach:
mockUseQuery.mockReturnValue({ page: [], isDone: true, continueCursor: "" });
```

Run: `npx vitest run src/__tests__/components/RecentMessages.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/relativeTime.ts src/components/RecentMessages.tsx
git commit -m "feat: RecentMessages contact names, relative timestamps, dividers, campaign link"
```

---

### Task 14: ContactFormDialog — add DialogDescription subtitle

**Files:**
- Modify: `src/components/ContactFormDialog.tsx`

- [ ] **Step 1: Add DialogDescription**

In `src/components/ContactFormDialog.tsx`, inside the `<DialogHeader>`:

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Inside DialogHeader, after DialogTitle:
<DialogDescription>
  {isEditMode ? "Update contact details" : "Add a new contact to your list"}
</DialogDescription>
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/__tests__/components/ContactFormDialog.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/ContactFormDialog.tsx
git commit -m "feat: add DialogDescription subtitle to ContactFormDialog"
```

---

### Task 15: DeleteConfirmDialog — type-to-confirm for bulk deletes

**Files:**
- Modify: `src/components/DeleteConfirmDialog.tsx`

- [ ] **Step 1: Add type-to-confirm input for count > 5**

In `src/components/DeleteConfirmDialog.tsx`:

1. Add `useState` import and a `confirmText` state:
```tsx
import { useState, useEffect } from "react";
// Inside component:
const [confirmText, setConfirmText] = useState("");
const requiresTyping = count > 5;
const canConfirm = !requiresTyping || confirmText === "DELETE";

// Reset on open/close
useEffect(() => {
  if (isOpen) setConfirmText("");
}, [isOpen]);
```

2. After the existing warning box (line 41), add the type-to-confirm input:
```tsx
{requiresTyping && (
  <div className="mb-4">
    <label className="block text-xs text-zinc-500 mb-1 text-left">
      Type <span className="font-mono font-bold text-zinc-300">DELETE</span> to confirm
    </label>
    <input
      type="text"
      value={confirmText}
      onChange={(e) => setConfirmText(e.target.value)}
      placeholder='Type "DELETE" to confirm'
      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus:ring-2 focus:ring-red-500/50 focus:border-red-500 outline-none text-sm"
      autoFocus
    />
  </div>
)}
```

3. Update the delete button to use `canConfirm`:
```tsx
<button
  type="button"
  onClick={onConfirm}
  disabled={isDeleting || !canConfirm}
  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
>
  {isDeleting ? "Deleting..." : "Delete"}
</button>
```

- [ ] **Step 2: Add test cases for type-to-confirm**

Add these tests to `src/__tests__/components/DeleteConfirmDialog.test.tsx`:

```tsx
it("disables delete button when count > 5 and DELETE not typed", () => {
  render(<DeleteConfirmDialog {...defaultProps} count={10} isOpen={true} />);
  const deleteBtn = screen.getByRole("button", { name: /delete/i });
  expect(deleteBtn).toBeDisabled();
});

it("enables delete button after typing DELETE for bulk deletes", () => {
  render(<DeleteConfirmDialog {...defaultProps} count={10} isOpen={true} />);
  const input = screen.getByPlaceholderText(/type "DELETE"/i);
  fireEvent.change(input, { target: { value: "DELETE" } });
  const deleteBtn = screen.getByRole("button", { name: /delete/i });
  expect(deleteBtn).not.toBeDisabled();
});

it("does not require typing for count <= 5", () => {
  render(<DeleteConfirmDialog {...defaultProps} count={3} isOpen={true} />);
  const deleteBtn = screen.getByRole("button", { name: /delete/i });
  expect(deleteBtn).not.toBeDisabled();
  expect(screen.queryByPlaceholderText(/type "DELETE"/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/__tests__/components/DeleteConfirmDialog.test.tsx`
Expected: PASS (all existing + 3 new tests)

- [ ] **Step 4: Commit**

```bash
git add src/components/DeleteConfirmDialog.tsx src/__tests__/components/DeleteConfirmDialog.test.tsx
git commit -m "feat: type-to-confirm DELETE for bulk deletes (>5 contacts)"
```

---

## Phase 2 — Agent D: Animations

### Task 16: StatsCard — react-countup animation

**Files:**
- Modify: `src/components/StatsCard.tsx`

- [ ] **Step 1: Add CountUp to StatsCard**

In `src/components/StatsCard.tsx`:

```tsx
import { useRef } from "react";
import CountUp from "react-countup";
import type { ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
}

export function StatsCard({ icon, iconBg, label, value }: StatsCardProps) {
  const prevValue = useRef(0);
  const isNumeric = typeof value === "number";

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 transition-transform hover:-translate-y-0.5 hover:border-zinc-700">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        <span className="text-sm text-zinc-500">{label}</span>
      </div>
      <span className="text-3xl font-bold text-zinc-100">
        {isNumeric ? (
          <CountUp
            start={prevValue.current}
            end={value}
            duration={1}
            separator=","
            onEnd={() => { prevValue.current = value; }}
          />
        ) : (
          value
        )}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/__tests__/components/StatsCard.test.tsx`

If tests fail due to react-countup, add mock:
```tsx
vi.mock("react-countup", () => ({
  default: ({ end }: { end: number }) => <span>{end}</span>,
}));
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/StatsCard.tsx src/__tests__/components/StatsCard.test.tsx
git commit -m "feat: animate StatsCard numbers with react-countup"
```

---

### Task 17: framer-motion on drop zones and page transitions

**Files:**
- Modify: `src/pages/UploadContactsPage.tsx`
- Modify: `src/components/MediaUpload.tsx`

- [ ] **Step 1: Add motion wrapper to UploadContactsPage drop zone**

In `src/pages/UploadContactsPage.tsx`:

1. Add import: `import { motion } from "framer-motion";`
2. Find the drag-and-drop zone `<div>` (the one with `border-2 border-dashed`)
3. Replace `<div` with `<motion.div` and add:

```tsx
<motion.div
  whileHover={{ scale: 1.01 }}
  whileTap={{ scale: 0.99 }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
  className="border-2 border-dashed ..."
  // ...keep existing props
>
```

- [ ] **Step 2: Add motion wrapper to MediaUpload drop zone**

Same pattern in `src/components/MediaUpload.tsx` — find the drop zone div and wrap with `motion.div`.

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/__tests__/pages/UploadContactsPage.test.tsx src/__tests__/components/MediaUpload.test.tsx`

Add framer-motion mock to both test files if needed:
```tsx
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/UploadContactsPage.tsx src/components/MediaUpload.tsx
git commit -m "feat: add framer-motion scale animations to drop zones"
```

---

## Final Verification

### Task 18: Full test suite + type check

- [ ] **Step 1: Run full check**

Run: `npm run check`
Expected: PASS (format + lint + types)

- [ ] **Step 2: Run full test suite**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve any remaining lint/type/test issues from UI polish"
```
