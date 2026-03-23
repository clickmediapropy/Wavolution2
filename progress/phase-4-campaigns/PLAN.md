# Phase 4: Campaign System + VPS Worker

**Goal:** Full bulk messaging: select contacts, start campaign, real-time progress, stop campaign. VPS worker processes the queue.

**Depends on:** Phase 3 (WhatsApp connected, messaging works)

---

## Deliverables

### Frontend
1. `BulkCampaignPage` — recipient selection (all/pending/selected), message template with personalization, media upload, delay config, start button
2. `CampaignStatusPage` — real-time progress bar, sent/failed/remaining counts, stop button
3. `CampaignProgress` component — reusable progress display (Convex subscription)

### Convex Backend
4. `convex/campaigns.ts` — mutations: create, updateProgress, stop; queries: getActive, getById, listByUser

### VPS Worker (new project in `worker/`)
5. Express API with endpoints:
   - POST /campaigns/start — start processing a campaign
   - POST /campaigns/stop — stop a running campaign
   - All /evolution/* proxy endpoints (from Phase 3, now running on the VPS)
   - GET /health — health check
6. Campaign processor service — reads campaign from Convex, iterates contacts, sends via Evolution API, writes progress back to Convex
7. Dockerfile + docker-compose.yml update
8. Shared secret auth (`VPS_API_SECRET`)

## TDD Steps

### Tests First

```
tests/
├── convex/
│   └── campaigns.test.ts         # Create, progress updates, stop, list queries
├── components/
│   └── CampaignProgress.test.tsx # Progress bar, counts, ETA display
├── pages/
│   ├── BulkCampaignPage.test.tsx # Recipient selection, template, media, start
│   └── CampaignStatusPage.test.tsx # Real-time progress, stop button
└── worker/
    ├── routes/
    │   ├── campaigns.test.ts     # Start/stop endpoints, auth validation
    │   └── evolution.test.ts     # Proxy endpoints, auth validation
    └── services/
        └── campaignProcessor.test.ts # Message iteration, delay, personalization, error handling
```

### Implementation Order

#### VPS Worker (build first — campaigns need it to work)

1. Initialize `worker/` project: `package.json`, `tsconfig.json`, Express setup
2. Write `worker/src/services/evolutionApi.ts` — HTTP client for Evolution API
3. Write `worker/src/services/campaignProcessor.ts`:
   - Reads campaign + contacts from Convex
   - Resolves recipients based on `recipientType`
   - For each contact: personalize template → send via Evolution API → log message to Convex → update progress
   - Checks for "stopped" status between sends
   - Crash recovery: checks messages table to skip already-sent contacts
   - Exponential backoff on send failures
4. Write `worker/src/routes/campaigns.ts` — start/stop endpoints
5. Write `worker/src/routes/evolution.ts` — proxy endpoints (createInstance, qrCode, status, sendText, sendMedia, deleteInstance)
6. Write `worker/src/index.ts` — Express server with auth middleware
7. Write `worker/src/convex.ts` — Convex client setup
8. Write `worker/Dockerfile`
9. Update VPS `docker-compose.yml` to include worker container
10. Write worker tests (mock Evolution API, mock Convex client)

#### Frontend + Convex

11. Write `convex/campaigns.ts` — mutations and queries
12. Write campaign tests
13. Write `CampaignProgress` component
14. Write `BulkCampaignPage` — recipient type selector, contact checkboxes, message template textarea with {name}/{phone} preview, media upload, delay slider, start button
15. Write `CampaignStatusPage` — subscribes to campaign query, shows real-time progress
16. Update `convex/evolution.ts` actions to point to VPS worker (if not already)
17. Run all tests, deploy worker to VPS, end-to-end test

## Verification Criteria

- [ ] VPS worker starts and responds to /health
- [ ] Worker auth rejects requests without valid VPS_API_SECRET
- [ ] Can start a campaign with "all contacts" recipient type
- [ ] Can start a campaign with "pending only" recipient type
- [ ] Can start a campaign with selected contacts
- [ ] Campaign progress updates in real-time on CampaignStatusPage
- [ ] Can stop a running campaign (remaining messages are not sent)
- [ ] Message personalization works ({name} and {phone} replaced)
- [ ] Campaign with media sends media to all recipients
- [ ] Failed sends are counted and don't stop the campaign
- [ ] After VPS worker restart, campaign can resume (skips already-sent)
- [ ] All tests pass (`vp test` for frontend, `vitest` for worker)

## Notes

- Default delay between messages: 5 seconds (safer than 2s for WhatsApp rate limits)
- Worker communicates with Evolution API via Docker service name (e.g., `http://evolution-api:8080`)
- Worker uses Convex service token (not deploy key) for security
- Campaign progress is truly real-time via Convex subscriptions — no polling needed
