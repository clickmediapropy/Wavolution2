# Fix Broken Tests & TypeScript Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 13 broken tests and 2 pre-existing TypeScript errors caused by the feature-parity additions (firstName/lastName schema, per-type media limits, campaign pause/resume, dashboard stats).

**Architecture:** Each test file needs its mocks updated to match the new API shapes. No production code changes needed — only test files and one pre-existing TS bug in WhatsAppPage.

**Tech Stack:** Vitest, React Testing Library, TypeScript

---

### Task 1: Fix ContactFormDialog tests (5 failures)

**Files:**
- Modify: `src/__tests__/components/ContactFormDialog.test.tsx`

**Root cause:** The dialog now has two name fields (`firstName`, `lastName`) instead of one `name` field. The `onSubmit` payload changed from `{ phone, name }` to `{ phone, firstName, lastName }`. The label "Name" now matches the first name field, and "Last Name" is a new field.

- [ ] **Step 1: Update the edit-mode contact mock**

Change line 56 from:
```typescript
const contact = { _id: "c1", phone: "+1234567890", name: "Alice" };
```
to:
```typescript
const contact = { _id: "c1", phone: "+1234567890", firstName: "Alice", lastName: "Smith" };
```

- [ ] **Step 2: Update "renders with empty fields" test (line 15)**

The label query `screen.getByLabelText(/name/i)` now matches TWO fields ("Name" and "Last Name"). Use a more specific query:
```typescript
expect(screen.getByLabelText("Name")).toHaveValue("");
expect(screen.getByLabelText("Last Name")).toHaveValue("");
```

- [ ] **Step 3: Update "calls onSubmit without id field" test (line 28)**

Change the form interactions and assertion:
```typescript
fireEvent.change(screen.getByLabelText("Name"), {
  target: { value: "Carlos" },
});
fireEvent.change(screen.getByLabelText("Last Name"), {
  target: { value: "Gomez" },
});
fireEvent.click(screen.getByRole("button", { name: /add contact/i }));

expect(onSubmit).toHaveBeenCalledWith({
  phone: "+595981123456",
  firstName: "Carlos",
  lastName: "Gomez",
});
```

- [ ] **Step 4: Update "renders with pre-filled fields" test (line 58)**

```typescript
expect(screen.getByLabelText("Name")).toHaveValue("Alice");
expect(screen.getByLabelText("Last Name")).toHaveValue("Smith");
```

- [ ] **Step 5: Update "calls onSubmit with id" test (line 69)**

```typescript
fireEvent.change(screen.getByLabelText("Name"), {
  target: { value: "Alice Updated" },
});
fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

expect(onSubmit).toHaveBeenCalledWith({
  id: "c1",
  phone: "+1234567890",
  firstName: "Alice Updated",
  lastName: "Smith",
});
```

- [ ] **Step 6: Update "handles contact with no name" test (line 95)**

```typescript
const noNameContact = { _id: "c2", phone: "+9876543210" };
render(<ContactFormDialog {...baseProps} contact={noNameContact} />);

expect(screen.getByLabelText("Name")).toHaveValue("");
expect(screen.getByLabelText("Last Name")).toHaveValue("");
```

- [ ] **Step 7: Also update the phone label query in "renders with empty fields"**

The phone field's label `/phone/i` is fine — it's still unique. Keep `screen.getByLabelText(/phone/i)`.

- [ ] **Step 8: Run tests**

Run: `npx vitest run src/__tests__/components/ContactFormDialog.test.tsx`
Expected: all 9 tests pass

- [ ] **Step 9: Commit**

```bash
git add src/__tests__/components/ContactFormDialog.test.tsx
git commit -m "test: update ContactFormDialog tests for firstName/lastName schema"
```

---

### Task 2: Fix ContactTable tests (2 failures)

**Files:**
- Modify: `src/__tests__/components/ContactTable.test.tsx`

**Root cause:** Mock contacts use `name` field, but the `Contact` interface now has `firstName`/`lastName`.

- [ ] **Step 1: Update mock contacts (lines 5-9)**

```typescript
const mockContacts = [
  { _id: "c1" as any, _creationTime: 1000, userId: "u1" as any, phone: "+1234567890", firstName: "Alice", status: "pending" },
  { _id: "c2" as any, _creationTime: 900, userId: "u1" as any, phone: "+0987654321", firstName: "Bob", status: "sent", sentAt: 1234567890 },
  { _id: "c3" as any, _creationTime: 800, userId: "u1" as any, phone: "+1111111111", status: "failed" },
];
```

- [ ] **Step 2: Update "sorts by name descending" assertion (line 157)**

The test checks that after sorting descending, the first data row contains "Bob". This should still work since `contactDisplayName` returns "Bob" for `{ firstName: "Bob" }`. No change needed.

- [ ] **Step 3: Run tests**

Run: `npx vitest run src/__tests__/components/ContactTable.test.tsx`
Expected: all 17 tests pass

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/components/ContactTable.test.tsx
git commit -m "test: update ContactTable mocks for firstName/lastName schema"
```

---

### Task 3: Fix MediaUpload test (1 failure)

**Files:**
- Modify: `src/__tests__/components/MediaUpload.test.tsx`

**Root cause:** Test creates a 17MB video file expecting rejection. But the new per-type limit for video is 50MB, so 17MB passes. Need to either increase to >50MB or change to an image type (limit 10MB).

- [ ] **Step 1: Update the oversized file test (line 70)**

Change the test to use an image file exceeding 10MB (the image limit):
```typescript
it("shows error for oversized files", () => {
  render(<MediaUpload onUpload={mockOnUpload} />);

  const input = screen.getByLabelText(/attach media/i) as HTMLInputElement;
  const file = new File(["x"], "big.jpg", { type: "image/jpeg" });
  Object.defineProperty(file, "size", { value: 11 * 1024 * 1024 });
  fireEvent.change(input, { target: { files: [file] } });

  expect(screen.getByText(/file too large/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/__tests__/components/MediaUpload.test.tsx`
Expected: all tests pass

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/components/MediaUpload.test.tsx
git commit -m "test: update MediaUpload test for per-type file size limits"
```

---

### Task 4: Fix CampaignStatusPage test (1 failure)

**Files:**
- Modify: `src/__tests__/pages/CampaignStatusPage.test.tsx`

**Root cause:** The "shows stop button" test looks for a button named `/stop campaign/i`, but the running state now shows two buttons: "Pause" and "Stop" (not "Stop Campaign"). The button text changed.

- [ ] **Step 1: Update the assertion (line 88)**

```typescript
it("shows pause and stop buttons for running campaigns", () => {
  mockUseQuery.mockReturnValue({
    _id: "campaign123",
    name: "Test Campaign",
    status: "running",
    recipientType: "all",
    total: 50,
    processed: 10,
    sent: 8,
    failed: 2,
    delay: 3000,
    messageTemplate: "Hi!",
    hasMedia: false,
    startedAt: Date.now(),
  });
  renderWithRoute("campaign123");

  expect(
    screen.getByRole("button", { name: /pause/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /stop/i }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Add a test for the paused state**

Add after the existing tests:
```typescript
it("shows resume and stop buttons for paused campaigns", () => {
  mockUseQuery.mockReturnValue({
    _id: "campaign123",
    name: "Paused Campaign",
    status: "paused",
    recipientType: "all",
    total: 50,
    processed: 10,
    sent: 8,
    failed: 2,
    delay: 3000,
    messageTemplate: "Hi!",
    hasMedia: false,
    startedAt: Date.now(),
  });
  renderWithRoute("campaign123");

  expect(
    screen.getByRole("button", { name: /resume/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /stop/i }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 3: Add a test for ETA display**

```typescript
it("shows estimated completion time for running campaigns", () => {
  mockUseQuery.mockReturnValue({
    _id: "campaign123",
    name: "ETA Test",
    status: "running",
    recipientType: "all",
    total: 100,
    processed: 50,
    sent: 45,
    failed: 5,
    delay: 5000,
    messageTemplate: "Hi!",
    hasMedia: false,
    startedAt: Date.now(),
  });
  renderWithRoute("campaign123");

  // (100 - 50) * 5000ms = 250000ms = ~4m 10s
  expect(screen.getByText(/remaining/i)).toBeInTheDocument();
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/__tests__/pages/CampaignStatusPage.test.tsx`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/pages/CampaignStatusPage.test.tsx
git commit -m "test: update CampaignStatusPage tests for pause/resume and ETA"
```

---

### Task 5: Fix ContactsPage tests (2 failures)

**Files:**
- Modify: `src/__tests__/pages/ContactsPage.test.tsx`

**Root cause:** Mock contacts use `name` field. Need `firstName`/`lastName`.

- [ ] **Step 1: Update mock contacts in "filters contacts" test (line 88)**

```typescript
results: [
  { _id: "c1", _creationTime: 1000, userId: "u1", phone: "+1111111111", firstName: "Alice", status: "pending" },
  { _id: "c2", _creationTime: 900, userId: "u1", phone: "+2222222222", firstName: "Bob", status: "sent" },
],
```

- [ ] **Step 2: Update mock contacts in "renders contacts" test (line 110)**

```typescript
results: [
  { _id: "c1", _creationTime: 1000, userId: "u1", phone: "+1234567890", firstName: "Alice", status: "pending" },
],
```

- [ ] **Step 3: Update all other mock contacts that use `name` field (lines 128)**

```typescript
results: [
  { _id: "c1", _creationTime: 1000, userId: "u1", phone: "+1234567890", firstName: "Alice", status: "pending" },
],
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/__tests__/pages/ContactsPage.test.tsx`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/pages/ContactsPage.test.tsx
git commit -m "test: update ContactsPage mocks for firstName/lastName schema"
```

---

### Task 6: Fix DashboardPage tests (2 failures)

**Files:**
- Modify: `src/__tests__/pages/DashboardPage.test.tsx`

**Root cause:** DashboardPage now calls `useQuery` 6 times (was 4). The mock returns values by call index, so the new queries shift all subsequent returns. Also, the "Campaigns" label changed to "Active Campaigns".

The new call order is:
1. `contacts.count` → 42
2. `contacts.countThisWeek` → 5
3. `messages.count` → 15
4. `messages.countToday` → 3
5. `campaigns.listByUser` → [{ _id: "camp1", status: "running" }]
6. `instances.count` → { total: 3, connected: 2 }

- [ ] **Step 1: Update the mock implementation (lines 28-36)**

```typescript
let callIndex = 0;
mockUseQuery.mockImplementation(() => {
  const i = callIndex++;
  if (i === 0) return 42;                                         // contacts.count
  if (i === 1) return 5;                                          // contacts.countThisWeek
  if (i === 2) return 15;                                         // messages.count
  if (i === 3) return 3;                                          // messages.countToday
  if (i === 4) return [{ _id: "camp1", status: "running" }];     // campaigns.listByUser
  if (i === 5) return { total: 3, connected: 2 };                // instances.count
  return null;
});
```

- [ ] **Step 2: Update "renders stat labels" assertion (line 100)**

Change from:
```typescript
expect(screen.getByText("Campaigns")).toBeInTheDocument();
```
to:
```typescript
expect(screen.getByText("Active Campaigns")).toBeInTheDocument();
```

- [ ] **Step 3: Update comment about call count (line 27)**

```typescript
// DashboardPage calls useQuery 6 times:
// 1. contacts.count, 2. contacts.countThisWeek, 3. messages.count,
// 4. messages.countToday, 5. campaigns.listByUser, 6. instances.count
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/__tests__/pages/DashboardPage.test.tsx`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/__tests__/pages/DashboardPage.test.tsx
git commit -m "test: update DashboardPage mocks for new stats queries"
```

---

### Task 7: Fix WhatsAppPage pre-existing TypeScript errors

**Files:**
- Modify: `src/pages/WhatsAppPage.tsx` (lines 60 and 91)

**Root cause:** `checkConnectionStatus` action requires `{ instanceName, instanceId }` but the calls on lines 60 and 91 only pass `{ instanceName }`. The `instanceId` argument was added when the `instances` table was created but these call sites weren't updated.

- [ ] **Step 1: Read WhatsAppPage.tsx to find the exact call sites**

Look for `checkStatus({` calls that are missing `instanceId`.

- [ ] **Step 2: Add instanceId to the polling call (around line 59-61)**

The code is inside a `useEffect` that has access to `instance._id`. Change:
```typescript
const result = await checkStatus({
  instanceName: instance.name,
  instanceId: instance._id,
});
```

- [ ] **Step 3: Find and fix the second call site (around line 91)**

Same pattern — add `instanceId: instance._id`.

- [ ] **Step 4: Run build**

Run: `npx convex codegen && npx vite build`
Expected: no TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add src/pages/WhatsAppPage.tsx
git commit -m "fix: pass instanceId to checkConnectionStatus calls in WhatsAppPage"
```

---

### Task 8: Final verification

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: 0 failures, all 208+ tests pass

- [ ] **Step 2: Run full build**

Run: `npx convex codegen && npx vite build`
Expected: clean build, no TS errors

- [ ] **Step 3: Verify no remaining TypeScript diagnostics**

Check that the only remaining warnings are the deprecated `FormEvent` warnings (React 19 deprecation — cosmetic, non-blocking).
