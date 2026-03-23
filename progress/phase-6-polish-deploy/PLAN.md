# Phase 6: Polish + Rate Limiting + Deploy

**Goal:** Production-ready app: landing page, error handling, rate limiting, responsive design, deployed to Vercel.

**Depends on:** Phase 5 (all features implemented)

---

## Deliverables

1. `LandingPage` — public marketing page (same design as current Flask landing)
2. `NotFoundPage` — 404 catch-all route
3. `ErrorBoundary` component — catches React rendering errors
4. `LoadingSpinner` improvements — skeleton loading states for all pages
5. Rate limiting on Convex mutations (using `@convex-dev/rate-limiter` or custom)
6. Responsive design pass — all pages work on mobile
7. Vercel deployment — connect repo, deploy, verify all routes work
8. Final QA: every feature parity item tested end-to-end

## TDD Steps

### Tests First

```
tests/
├── convex/
│   └── rateLimiter.test.ts     # Rate limits reject excess requests
├── components/
│   ├── ErrorBoundary.test.tsx  # Catches errors, shows fallback UI
│   └── LoadingSpinner.test.tsx # Renders correctly
└── pages/
    ├── LandingPage.test.tsx    # Renders hero, features, CTA buttons
    └── NotFoundPage.test.tsx   # Shows 404 message with link home
```

### Implementation Order

1. Write `LandingPage` — hero section, features list, login/register CTAs
2. Write `NotFoundPage` — friendly 404 with "Go Home" link
3. Write `ErrorBoundary` — wraps app, catches errors, shows retry button
4. Implement rate limiting:
   - Login: 20 attempts per minute per IP (or per email)
   - Register: 10 per minute
   - Send message: 100 per hour per user
   - Start campaign: 5 per hour per user
   - Contact operations: 60 per minute per user
5. Responsive design pass:
   - Navbar: hamburger menu on mobile
   - ContactTable: horizontal scroll or card layout on mobile
   - Dashboard: stack grid cards on small screens
   - Forms: full-width inputs on mobile
6. Write tests
7. Deploy to Vercel:
   - `vercel link` — connect project
   - Set environment variables (CONVEX_DEPLOY_KEY for Convex, etc.)
   - `vercel deploy` — verify preview deployment
   - Test all routes work (SPA rewrites)
   - `vercel --prod` — promote to production
8. Final QA: run through every feature parity checklist item

## Rate Limiting Design

Using `@convex-dev/rate-limiter` (or `convex-helpers`):

```typescript
// convex/rateLimits.ts
import { defineRateLimits } from "convex-helpers/server/rateLimit";

export const { checkRateLimit, rateLimit } = defineRateLimits({
  sendMessage: { kind: "token bucket", rate: 100, period: 60 * 60 * 1000, capacity: 100 },
  startCampaign: { kind: "fixed window", rate: 5, period: 60 * 60 * 1000 },
  login: { kind: "fixed window", rate: 20, period: 60 * 1000 },
  register: { kind: "fixed window", rate: 10, period: 60 * 1000 },
  contactOps: { kind: "token bucket", rate: 60, period: 60 * 1000, capacity: 60 },
});
```

## Verification Criteria

- [ ] Landing page renders at `/landing` with login/register links
- [ ] 404 page shows for unknown routes (e.g., `/nonexistent`)
- [ ] ErrorBoundary catches and displays rendering errors
- [ ] Rate limiting rejects excessive login attempts
- [ ] Rate limiting rejects excessive message sends
- [ ] All pages are usable on mobile (320px viewport)
- [ ] Navbar collapses to hamburger on mobile
- [ ] App deployed to Vercel and accessible via URL
- [ ] All routes work on Vercel (SPA rewrites functional)
- [ ] Complete feature parity checklist passes (all 28 items)
- [ ] All tests pass (`vp test`)

## Feature Parity Final Checklist

Run through every item before marking Phase 6 complete:

- [ ] Register new account
- [ ] Login / logout
- [ ] Create Evolution API instance
- [ ] Connect WhatsApp via QR code
- [ ] View contact list (paginated, searchable)
- [ ] Add / edit / delete contacts
- [ ] Import contacts from CSV
- [ ] Send single text message
- [ ] Send message with image
- [ ] Send message with video
- [ ] Send message with multiple media
- [ ] Start bulk campaign (all contacts)
- [ ] Start bulk campaign (pending only)
- [ ] Start bulk campaign (selected contacts)
- [ ] Campaign personalization ({name}, {phone})
- [ ] Campaign with media
- [ ] Real-time campaign progress
- [ ] Stop campaign
- [ ] Dashboard stats
- [ ] Dashboard connection status
- [ ] Dashboard recent messages
- [ ] Landing page
- [ ] 404 page
- [ ] Toast notifications
- [ ] Responsive on mobile
- [ ] Rate limiting works
- [ ] Media validation (type + size)
- [ ] Auth-protected file uploads
