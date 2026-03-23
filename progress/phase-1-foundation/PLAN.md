# Phase 1: Foundation

**Goal:** From zero to "can register, log in, and see a protected dashboard shell."

**Depends on:** Nothing (first phase)

---

## Deliverables

1. Vite+ project scaffold with React, TypeScript, React Router
2. Tailwind CSS + shadcn/ui initialized (with `cn()` utility, Lucide icons)
3. Convex connected and running (`npx convex dev`)
4. Full Convex schema (`schema.ts`) — all tables, indexes, search indexes
5. Convex Auth with Password provider — register, login, logout
6. `AppLayout` component (navbar, footer, toast via Sonner)
7. `ProtectedRoute` component
8. Login page, Register page
9. Dashboard shell (empty, but protected — redirects if not authenticated)
10. `vercel.json` with SPA rewrites
11. `ConvexAuthProvider` wrapping the app

## TDD Steps

### Tests First (write before implementation)

```
tests/
├── convex/
│   ├── schema.test.ts          # Schema validates correctly
│   └── auth.test.ts            # Register creates user, login returns session, logout clears
├── components/
│   ├── ProtectedRoute.test.tsx # Redirects when not authenticated
│   └── AppLayout.test.tsx      # Renders navbar, footer, children
└── pages/
    ├── LoginPage.test.tsx      # Form submits, calls signIn, redirects on success
    └── RegisterPage.test.tsx   # Form submits, calls signUp, redirects on success
```

### Implementation Order

1. `vp create` — scaffold Vite+ React TypeScript project
2. Install dependencies: `convex`, `@convex-dev/auth`, `react-router-dom`, `tailwindcss`, `lucide-react`
3. `npx shadcn@latest init` — sets up shadcn/ui, `cn()`, Tailwind config
4. `npx convex init` — sets up Convex project
5. Write `convex/schema.ts` — all tables from spec (users, contacts, messages, campaigns)
6. Write `convex/auth.config.ts` + `convex/auth.ts` — Password provider
7. Write tests for schema and auth
8. Write `src/App.tsx` — ConvexAuthProvider + React Router
9. Write `src/components/AppLayout.tsx` — navbar with Lucide icons, Sonner toasts
10. Write `src/components/ProtectedRoute.tsx` — useConvexAuth() guard
11. Write `src/pages/LoginPage.tsx` + `RegisterPage.tsx`
12. Write `src/pages/DashboardPage.tsx` — empty shell, just "Welcome" text
13. Write `vercel.json`
14. Run all tests, manual verification

## Verification Criteria

- [ ] `vp dev` starts without errors
- [ ] `npx convex dev` connects to Convex cloud
- [ ] Can register a new account
- [ ] Can login with registered account
- [ ] Dashboard page is protected (redirects to login if not authenticated)
- [ ] Logout works (redirects to login)
- [ ] Toast notifications appear (via Sonner)
- [ ] All tests pass (`vp test`)
