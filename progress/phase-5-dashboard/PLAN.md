# Phase 5: Dashboard

**Goal:** Complete dashboard with stats, connection status, recent messages, and quick action links.

**Depends on:** Phase 4 (all data — contacts, messages, campaigns — exists)

---

## Deliverables

1. `DashboardPage` — replaces empty shell from Phase 1
2. `StatsCard` component — reusable stat display (icon, label, value)
3. Stats section: total contacts, messages sent today, total messages, active campaigns
4. Connection status indicator (green/red dot + status text)
5. Recent messages list (last 5 messages with contact, preview, timestamp)
6. Quick action buttons: Send Message, Bulk Send, View Contacts
7. Active campaign progress inline (if a campaign is running)

## TDD Steps

### Tests First

```
tests/
├── convex/
│   ├── dashboard.test.ts       # Stats query returns correct counts
│   └── messages.test.ts        # Recent messages query with limit
├── components/
│   └── StatsCard.test.tsx      # Renders icon, label, value correctly
└── pages/
    └── DashboardPage.test.tsx  # Shows stats, connection, recent messages, handles loading state
```

### Implementation Order

1. Write `convex/dashboard.ts` — query that returns aggregated stats:
   - Total contacts count
   - Messages sent today (filter by `_creationTime`)
   - Total messages count
   - Active campaign (if any)
   - Connection status (from user document)
2. Write `convex/messages.ts` — `listRecent` query (by user, limit 5, ordered by `_creationTime` desc)
3. Write tests for dashboard and messages queries
4. Write `StatsCard` component — shadcn Card with Lucide icon, label, value
5. Write `DashboardPage`:
   - 4 StatsCards in a grid
   - Connection status indicator
   - Recent messages list
   - Active campaign progress (reuse `CampaignProgress` from Phase 4)
   - Quick action buttons linking to /send, /campaigns, /contacts
6. Handle loading states (LoadingSpinner while queries return undefined)
7. Run all tests, manual verification

## Verification Criteria

- [ ] Dashboard shows correct total contacts count
- [ ] Dashboard shows correct messages sent today
- [ ] Dashboard shows correct total messages
- [ ] Connection status shows green when WhatsApp connected
- [ ] Connection status shows red when disconnected
- [ ] Recent messages show last 5 messages with truncated preview
- [ ] Active campaign progress shows inline when a campaign is running
- [ ] Quick action buttons navigate to correct pages
- [ ] Loading state shows spinner before data loads
- [ ] All tests pass (`vp test`)
