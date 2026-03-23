# Message Hub Feature Parity — Design Spec

**Date:** 2026-03-23
**Goal:** Add 12 features from [orendrasingh/message-hub](https://github.com/orendrasingh/message-hub) that wavolution2 is missing.

---

## Feature List

| # | Feature | Group | Files Touched |
|---|---------|-------|---------------|
| 1 | Contact CSV Export | Contacts | `convex/contacts.ts`, `ContactsPage.tsx` |
| 2 | Sample CSV Download | Contacts | `public/sample-contacts.csv`, `UploadContactsPage.tsx` |
| 3 | {first_name} variable | Messaging | `MessageTemplateEditor.tsx` |
| 4 | Campaign Pause/Resume | Campaigns | `convex/campaigns.ts`, `CampaignStatusPage.tsx` |
| 5 | Estimated Completion Time | Campaigns | `CampaignStatusPage.tsx` |
| 6 | Campaign History Page | Campaigns | NEW `CampaignHistoryPage.tsx`, `App.tsx`, `AppLayout.tsx` |
| 7 | Media file size validation | Media | `MediaUpload.tsx` |
| 8 | Media thumbnail generation | Media | `MediaUpload.tsx` |
| 9 | Media reordering (drag & drop) | Media | `MediaUpload.tsx` |
| 10 | Time-based dashboard stats | Dashboard | `convex/contacts.ts`, `convex/messages.ts`, `DashboardPage.tsx` |
| 11 | Active campaigns count | Dashboard | `DashboardPage.tsx` |
| 12 | Rate limiting on sends | Security | `convex/evolution.ts` |

---

## Detailed Design

### 1. Contact CSV Export

**Backend:** New `contacts.exportAll` query — returns all contacts for the user (no pagination). Capped at 10,000 contacts.

```typescript
// convex/contacts.ts
export const exportAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    return await ctx.db
      .query("contacts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(10000);
  },
});
```

**Frontend:** "Export CSV" button in ContactsPage toolbar. Client-side CSV generation:
- Headers: `name,phone,status`
- Use `Blob` + `URL.createObjectURL` + invisible `<a>` click
- Filename: `contacts-YYYY-MM-DD.csv`

---

### 2. Sample CSV Download

**Static file:** `public/sample-contacts.csv`
```csv
name,phone
John Smith,+1234567890
Maria Garcia,+0987654321
Ahmed Hassan,+1122334455
```

**Frontend:** "Download Template" link/button on UploadContactsPage, above the drag-drop zone.

---

### 3. {first_name} Personalization Variable

**Logic:** `contact.name?.split(" ")[0] || contact.name || ""`

**Frontend:** Add `{first_name}` button to MessageTemplateEditor alongside existing `{name}` and `{phone}` buttons.

**Backend:** No changes needed — variable substitution happens at send time in the campaign worker. For now, just add the UI variable insertion. The worker will resolve `{first_name}` by splitting the contact's name.

---

### 4. Campaign Pause/Resume

**Schema change:** Campaign status enum becomes: `draft | running | paused | completed | stopped`

**New mutations in `convex/campaigns.ts`:**

```typescript
export const pause = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    // Verify ownership, check status === "running"
    await ctx.db.patch(args.id, { status: "paused" });
  },
});

export const resume = mutation({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    // Verify ownership, check status === "paused"
    await ctx.db.patch(args.id, { status: "running" });
  },
});
```

**Update `campaigns.start`:** Also allow starting from `"paused"` status (resume alias).

**Frontend (CampaignStatusPage):**
- When `status === "running"`: show Pause button (yellow) + Stop button (red)
- When `status === "paused"`: show Resume button (green) + Stop button (red)
- Paused state shows a yellow "Paused" badge

---

### 5. Estimated Completion Time

**Calculation:** `remainingMs = (campaign.total - campaign.processed) * campaign.delay`

**Display on CampaignStatusPage:**
- While running/paused: "~X min Y sec remaining"
- Format: if < 1 min show seconds, if < 60 min show minutes, else show hours+minutes
- Updates in real-time as `processed` increments (Convex subscription)

---

### 6. Campaign History Page

**New page:** `src/pages/CampaignHistoryPage.tsx` at route `/campaigns`

**Content:**
- Page title: "Campaign History"
- Table/card list of all campaigns from `campaigns.listByUser`
- Each row shows: name, status badge (colored), recipient count, sent/failed, date
- Click row → navigate to `/campaigns/:id` (existing CampaignStatusPage)
- Empty state: "No campaigns yet" with link to create one

**Navigation:** Add "Campaigns" link to AppLayout nav menu (between Contacts and Send Message).

---

### 7. Media File Size Validation

**Constants (in MediaUpload.tsx):**
```typescript
const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024,   // 10MB
  video: 50 * 1024 * 1024,   // 50MB
  document: 20 * 1024 * 1024, // 20MB
  audio: 20 * 1024 * 1024,    // 20MB
};
```

**Validation:** On file select/drop, check `file.size` against limit for detected media type. Reject with toast: "File too large. Max size for images is 10MB."

**Display:** Show accepted file types and size limits as helper text below the upload zone.

---

### 8. Media Thumbnail Generation

**Images:** Use `<canvas>` to resize to 80x80px thumbnail. Store as data URL in component state.

**Videos:** Use `<video>` element, seek to 1s, capture frame with `<canvas>`. Show as thumbnail.

**Documents/Audio:** Show file-type icon (from lucide-react: `FileText`, `Music`).

**Display:** Replace current file name list with a thumbnail grid showing preview + filename + size + remove button.

---

### 9. Media Reordering

**Implementation:** Use Framer Motion's `Reorder.Group` and `Reorder.Item` (already installed).

**Behavior:**
- Drag handle (grip icon) on each media item
- Reorder updates the array in parent state
- Array order = send order in campaign

---

### 10. Time-Based Dashboard Stats

**New queries:**

```typescript
// convex/contacts.ts
export const countThisWeek = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthedUserId(ctx);
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return contacts.filter((c) => c._creationTime > weekAgo).length;
  },
});

// convex/messages.ts
export const countToday = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    return messages.filter((m) => m._creationTime > todayStart.getTime()).length;
  },
});
```

**Frontend:** Show as secondary line under each StatsCard: "+X this week" / "+X today"

---

### 11. Active Campaigns Count

**Frontend change in DashboardPage:**
- Primary value: count of campaigns where `status === "running"` or `status === "paused"`
- Secondary text: "X total" showing `campaigns.length`

---

### 12. Rate Limiting on Sends

**Implementation:** Use Convex's built-in rate limiting pattern with a helper.

```typescript
// convex/evolution.ts — add at top
import { RateLimiter } from "convex-helpers/server/rateLimit";

const rateLimiter = new RateLimiter(components.rateLimiter, {
  sendMessage: { kind: "token bucket", rate: 100, period: 60 * 60 * 1000, capacity: 100 },
});
```

**Note:** If `convex-helpers` rate limiter is not installed, use a simpler approach: query recent messages count in the last hour before sending. If > 100, throw error.

**Simpler fallback approach:**
```typescript
// In sendText/sendMedia handlers, before sending:
const recentCount = await ctx.runQuery(api.messages.countRecent, { minutes: 60 });
if (recentCount >= 100) {
  throw new Error("Rate limit exceeded. Max 100 messages per hour.");
}
```

Add `messages.countRecent` query that counts messages in the last N minutes.

---

## Execution Strategy

Five parallel workstreams:
1. **Contacts agent** — Features 1, 2, 3
2. **Campaigns agent** — Features 4, 5, 6
3. **Media agent** — Features 7, 8, 9
4. **Dashboard agent** — Features 10, 11
5. **Security agent** — Feature 12

No cross-dependencies between groups. Each agent can work independently.

---

## Success Criteria

- All 12 features functional
- No regressions to existing features
- TypeScript compiles cleanly (`npm run build`)
- Dark theme consistency maintained
