# WhatsApp Connection + Single Messaging — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect WhatsApp via QR code scanning and send single text/media messages to contacts through the Evolution API.

**Architecture:** React frontend calls Convex mutations/queries for state, and Convex actions proxy HTTP requests to the Evolution API running on VPS (`wavolution.agentifycrm.io:8080`). User's WhatsApp connection state (`instanceCreated`, `whatsappConnected`) lives in the `users` table and drives a `WhatsAppGuard` component that gates messaging features. Media files upload to Convex storage and their URLs pass to Evolution API for sending.

**Tech Stack:** Vite 8, React 19, TypeScript, Tailwind CSS v4, Convex (actions + mutations + queries), Evolution API v2.2.3, Vitest + React Testing Library

**IMPORTANT CONVENTIONS:**
- Auth: Always use `getAuthUserId(ctx)` from `@convex-dev/auth/server` — never accept userId as argument
- Imports: Use `@convex/_generated/api` alias (not relative paths)
- Actions: `fetch()` is available in default Convex runtime — no `"use node"` needed
- Actions cannot use `ctx.db` — update user docs via `ctx.runMutation()`
- Tests: Mock `convex/react` for hooks, wrap in `<MemoryRouter>`, use `fireEvent` (no userEvent)
- Read `convex/_generated/ai/guidelines.md` before writing any Convex code

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `convex/users.ts` | Queries/mutations for user profile (WhatsApp state, instance info) |
| `convex/evolution.ts` | Actions that proxy HTTP to Evolution API (create instance, QR, status, send) |
| `convex/storage.ts` | Auth-protected `generateUploadUrl` mutation |
| `convex/messages.ts` | Mutation to log sent messages |
| `src/components/WhatsAppGuard.tsx` | Redirects users to setup/connect if not connected |
| `src/components/MediaUpload.tsx` | File selection, validation, preview, Convex storage upload |
| `src/pages/SetupWhatsAppPage.tsx` | Create Evolution API instance for user |
| `src/pages/ConnectWhatsAppPage.tsx` | QR code display, poll connection status |
| `src/pages/SendMessagePage.tsx` | Contact selector, message input, media upload, send |
| `src/__tests__/convex/users.test.ts` | Tests for user profile queries/mutations |
| `src/__tests__/convex/evolution.test.ts` | Tests for Evolution API actions (mocked HTTP) |
| `src/__tests__/components/WhatsAppGuard.test.tsx` | Redirect logic tests |
| `src/__tests__/components/MediaUpload.test.tsx` | File validation, preview, upload tests |
| `src/__tests__/pages/SetupWhatsAppPage.test.tsx` | Instance creation flow tests |
| `src/__tests__/pages/ConnectWhatsAppPage.test.tsx` | QR display, polling, redirect tests |
| `src/__tests__/pages/SendMessagePage.test.tsx` | Send flow tests |

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Add routes: `/whatsapp/setup`, `/whatsapp/connect`, `/send` |
| `src/components/AppLayout.tsx` | Add "Send Message" nav link |

---

## Task 1: User Profile Query & Mutations (`convex/users.ts`)

The `WhatsAppGuard` and setup pages need to read/write the user's WhatsApp connection state. This must be a separate file from `convex/evolution.ts` because queries/mutations can't coexist with `"use node"` actions (though we won't need `"use node"` here, keeping them separate follows the Convex pattern of separating DB access from external calls).

**Files:**
- Create: `convex/users.ts`
- Create: `src/__tests__/convex/users.test.ts`

- [ ] **Step 1: Write the test file for user queries/mutations**

```ts
// src/__tests__/convex/users.test.ts
import { describe, it, expect } from "vitest";

// These are integration-level type checks — verifying the function signatures
// exist and are importable. Actual execution requires a Convex backend.
describe("convex/users", () => {
  it("exports currentUser query", async () => {
    const mod = await import("@convex/users");
    expect(mod.currentUser).toBeDefined();
  });

  it("exports updateWhatsAppState mutation", async () => {
    const mod = await import("@convex/users");
    expect(mod.updateWhatsAppState).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/convex/users.test.ts`
Expected: FAIL — module `@convex/users` not found

- [ ] **Step 3: Write `convex/users.ts`**

```ts
// convex/users.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current authenticated user's profile
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

// Update WhatsApp-related fields on user doc
export const updateWhatsAppState = mutation({
  args: {
    evolutionInstanceName: v.optional(v.string()),
    evolutionApiKey: v.optional(v.string()),
    instanceCreated: v.optional(v.boolean()),
    whatsappConnected: v.optional(v.boolean()),
    whatsappNumber: v.optional(v.string()),
    connectionStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, args);
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/convex/users.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add convex/users.ts src/__tests__/convex/users.test.ts
git commit -m "feat: add user profile query and WhatsApp state mutation"
```

---

## Task 2: Evolution API Actions (`convex/evolution.ts`)

These actions proxy HTTP calls to the Evolution API on the VPS. They use `fetch()` (available in default Convex runtime) and update user state via `ctx.runMutation()`.

**Files:**
- Create: `convex/evolution.ts`
- Create: `src/__tests__/convex/evolution.test.ts`

- [ ] **Step 1: Write the test file**

```ts
// src/__tests__/convex/evolution.test.ts
import { describe, it, expect } from "vitest";

describe("convex/evolution", () => {
  it("exports createInstance action", async () => {
    const mod = await import("@convex/evolution");
    expect(mod.createInstance).toBeDefined();
  });

  it("exports getQrCode action", async () => {
    const mod = await import("@convex/evolution");
    expect(mod.getQrCode).toBeDefined();
  });

  it("exports checkConnectionStatus action", async () => {
    const mod = await import("@convex/evolution");
    expect(mod.checkConnectionStatus).toBeDefined();
  });

  it("exports sendText action", async () => {
    const mod = await import("@convex/evolution");
    expect(mod.sendText).toBeDefined();
  });

  it("exports sendMedia action", async () => {
    const mod = await import("@convex/evolution");
    expect(mod.sendMedia).toBeDefined();
  });

  it("exports deleteInstance action", async () => {
    const mod = await import("@convex/evolution");
    expect(mod.deleteInstance).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/convex/evolution.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write `convex/evolution.ts`**

The Evolution API base URL comes from `EVOLUTION_API_URL` environment variable (set in Convex dashboard). Each action authenticates via `getAuthUserId`, then makes an HTTP call.

```ts
// convex/evolution.ts
import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// Type declaration for process.env in Convex runtime
declare const process: { env: Record<string, string | undefined> };

// Helper: get base URL from env
function getBaseUrl(): string {
  const url = process.env.EVOLUTION_API_URL;
  if (!url) throw new Error("EVOLUTION_API_URL not configured");
  return url.replace(/\/$/, ""); // strip trailing slash
}

// Helper: get global API key from env
function getGlobalApiKey(): string {
  const key = process.env.EVOLUTION_API_KEY;
  if (!key) throw new Error("EVOLUTION_API_KEY not configured");
  return key;
}

// Create a new Evolution API instance for the user
export const createInstance = action({
  args: { instanceName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const baseUrl = getBaseUrl();
    const apiKey = getGlobalApiKey();

    const res = await fetch(`${baseUrl}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        instanceName: args.instanceName,
        integration: "WHATSAPP-BAILEYS",
        qrcode: true,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create instance: ${text}`);
    }

    const data = await res.json();

    // Update user doc with instance info
    await ctx.runMutation(api.users.updateWhatsAppState, {
      evolutionInstanceName: args.instanceName,
      evolutionApiKey: data.hash || undefined,
      instanceCreated: true,
      connectionStatus: "pending",
    });

    return data;
  },
});

// Get QR code for connecting WhatsApp
export const getQrCode = action({
  args: { instanceName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const baseUrl = getBaseUrl();
    const apiKey = getGlobalApiKey();

    const res = await fetch(
      `${baseUrl}/instance/connect/${args.instanceName}`,
      {
        method: "GET",
        headers: { apikey: apiKey },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to get QR code: ${text}`);
    }

    return await res.json();
  },
});

// Check if WhatsApp is connected
export const checkConnectionStatus = action({
  args: { instanceName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const baseUrl = getBaseUrl();
    const apiKey = getGlobalApiKey();

    const res = await fetch(
      `${baseUrl}/instance/connectionState/${args.instanceName}`,
      {
        method: "GET",
        headers: { apikey: apiKey },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to check status: ${text}`);
    }

    const data = await res.json();
    const state = data.instance?.state || data.state || "unknown";

    // Update user doc if connected
    if (state === "open") {
      await ctx.runMutation(api.users.updateWhatsAppState, {
        whatsappConnected: true,
        connectionStatus: "open",
      });
    } else {
      await ctx.runMutation(api.users.updateWhatsAppState, {
        connectionStatus: state,
      });
    }

    return { state };
  },
});

// Send a text message
export const sendText = action({
  args: {
    instanceName: v.string(),
    phone: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const baseUrl = getBaseUrl();
    const apiKey = getGlobalApiKey();

    const res = await fetch(
      `${baseUrl}/message/sendText/${args.instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: args.phone,
          text: args.message,
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to send message: ${text}`);
    }

    return await res.json();
  },
});

// Send a media message (image, video, document)
// Accepts storageId and resolves the URL server-side via ctx.runQuery()
export const sendMedia = action({
  args: {
    instanceName: v.string(),
    phone: v.string(),
    storageId: v.id("_storage"),
    mediaType: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("document"),
      v.literal("audio"),
    ),
    caption: v.optional(v.string()),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Resolve storage URL server-side
    const mediaUrl: string | null = await ctx.runQuery(
      api.storage.getFileUrl,
      { storageId: args.storageId },
    );
    if (!mediaUrl) throw new Error("Media file not found");

    const baseUrl = getBaseUrl();
    const apiKey = getGlobalApiKey();

    const res = await fetch(
      `${baseUrl}/message/sendMedia/${args.instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: args.phone,
          mediatype: args.mediaType,
          media: mediaUrl,
          caption: args.caption || "",
          fileName: args.fileName || "",
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to send media: ${text}`);
    }

    return await res.json();
  },
});

// Delete an instance
export const deleteInstance = action({
  args: { instanceName: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const baseUrl = getBaseUrl();
    const apiKey = getGlobalApiKey();

    const res = await fetch(
      `${baseUrl}/instance/delete/${args.instanceName}`,
      {
        method: "DELETE",
        headers: { apikey: apiKey },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to delete instance: ${text}`);
    }

    await ctx.runMutation(api.users.updateWhatsAppState, {
      instanceCreated: false,
      whatsappConnected: false,
      connectionStatus: undefined,
      evolutionInstanceName: undefined,
      evolutionApiKey: undefined,
    });

    return { success: true };
  },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/convex/evolution.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add convex/evolution.ts src/__tests__/convex/evolution.test.ts
git commit -m "feat: add Evolution API action proxies (create, QR, status, send, delete)"
```

---

## Task 3: Auth-Protected Upload URL (`convex/storage.ts`)

Media uploads need a Convex-generated upload URL. This mutation verifies the user is authenticated before generating one.

**Files:**
- Create: `convex/storage.ts`

- [ ] **Step 1: Write `convex/storage.ts`**

```ts
// convex/storage.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generate a signed upload URL (auth-protected)
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

// Get a serving URL for a stored file
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
```

- [ ] **Step 2: Run all tests to verify nothing broke**

Run: `npx vitest run`
Expected: All existing tests PASS

- [ ] **Step 3: Commit**

```bash
git add convex/storage.ts
git commit -m "feat: add auth-protected file upload URL generation"
```

---

## Task 4: Message Logging Mutation (`convex/messages.ts`)

Log every sent message to the `messages` table for history tracking.

**Files:**
- Create: `convex/messages.ts`

- [ ] **Step 1: Write `convex/messages.ts`**

```ts
// convex/messages.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

// Log a sent message
export const logMessage = mutation({
  args: {
    phone: v.string(),
    message: v.string(),
    status: v.string(),
    campaignId: v.optional(v.id("campaigns")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db.insert("messages", {
      userId,
      phone: args.phone,
      message: args.message,
      status: args.status,
      campaignId: args.campaignId,
    });
  },
});

// List messages for current user (newest first)
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db
      .query("messages")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add convex/messages.ts
git commit -m "feat: add message logging mutation and list query"
```

---

## Task 5: WhatsAppGuard Component

Checks the user's `instanceCreated` and `whatsappConnected` fields. Redirects to `/whatsapp/setup` if no instance, to `/whatsapp/connect` if instance exists but not connected, and renders children if connected.

**Files:**
- Create: `src/components/WhatsAppGuard.tsx`
- Create: `src/__tests__/components/WhatsAppGuard.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
// src/__tests__/components/WhatsAppGuard.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { WhatsAppGuard } from "@/components/WhatsAppGuard";

// Mock convex/react — useQuery returns the user object
const mockUseQuery = vi.fn();
vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

describe("WhatsAppGuard", () => {
  it("shows loading while user data is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    render(
      <MemoryRouter>
        <WhatsAppGuard>
          <div>messaging content</div>
        </WhatsAppGuard>
      </MemoryRouter>,
    );

    expect(screen.queryByText("messaging content")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("redirects to /whatsapp/setup when no instance created", () => {
    mockUseQuery.mockReturnValue({
      instanceCreated: false,
      whatsappConnected: false,
    });

    render(
      <MemoryRouter initialEntries={["/send"]}>
        <WhatsAppGuard>
          <div>messaging content</div>
        </WhatsAppGuard>
      </MemoryRouter>,
    );

    expect(screen.queryByText("messaging content")).not.toBeInTheDocument();
  });

  it("redirects to /whatsapp/connect when instance created but not connected", () => {
    mockUseQuery.mockReturnValue({
      instanceCreated: true,
      whatsappConnected: false,
    });

    render(
      <MemoryRouter initialEntries={["/send"]}>
        <WhatsAppGuard>
          <div>messaging content</div>
        </WhatsAppGuard>
      </MemoryRouter>,
    );

    expect(screen.queryByText("messaging content")).not.toBeInTheDocument();
  });

  it("renders children when WhatsApp is connected", () => {
    mockUseQuery.mockReturnValue({
      instanceCreated: true,
      whatsappConnected: true,
    });

    render(
      <MemoryRouter>
        <WhatsAppGuard>
          <div>messaging content</div>
        </WhatsAppGuard>
      </MemoryRouter>,
    );

    expect(screen.getByText("messaging content")).toBeInTheDocument();
  });

  it("treats null user (not authenticated) as needing setup", () => {
    mockUseQuery.mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={["/send"]}>
        <WhatsAppGuard>
          <div>messaging content</div>
        </WhatsAppGuard>
      </MemoryRouter>,
    );

    expect(screen.queryByText("messaging content")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/WhatsAppGuard.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write `src/components/WhatsAppGuard.tsx`**

```tsx
// src/components/WhatsAppGuard.tsx
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2 } from "lucide-react";

export function WhatsAppGuard({ children }: { children: ReactNode }) {
  const user = useQuery(api.users.currentUser);

  // Loading state
  if (user === undefined) {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // No user or no instance → setup
  if (!user || !user.instanceCreated) {
    return <Navigate to="/whatsapp/setup" replace />;
  }

  // Instance exists but not connected → connect
  if (!user.whatsappConnected) {
    return <Navigate to="/whatsapp/connect" replace />;
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/WhatsAppGuard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/WhatsAppGuard.tsx src/__tests__/components/WhatsAppGuard.test.tsx
git commit -m "feat: add WhatsAppGuard component with redirect logic"
```

---

## Task 6: SetupWhatsAppPage

A simple page with a button that creates an Evolution API instance. Generates an instance name from the user's ID (e.g., `user_<short-id>`).

**Files:**
- Create: `src/pages/SetupWhatsAppPage.tsx`
- Create: `src/__tests__/pages/SetupWhatsAppPage.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
// src/__tests__/pages/SetupWhatsAppPage.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SetupWhatsAppPage } from "@/pages/SetupWhatsAppPage";

const mockUseQuery = vi.fn();
const mockUseAction = vi.fn();
const mockNavigate = vi.fn();

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useAction: () => mockUseAction(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("SetupWhatsAppPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAction.mockReturnValue(vi.fn());
  });

  it("renders setup heading and button", () => {
    mockUseQuery.mockReturnValue({ _id: "user123", instanceCreated: false });

    render(
      <MemoryRouter>
        <SetupWhatsAppPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /whatsapp setup/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create instance/i }),
    ).toBeInTheDocument();
  });

  it("redirects to /whatsapp/connect if instance already created", () => {
    mockUseQuery.mockReturnValue({ _id: "user123", instanceCreated: true });

    render(
      <MemoryRouter initialEntries={["/whatsapp/setup"]}>
        <SetupWhatsAppPage />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("button", { name: /create instance/i }),
    ).not.toBeInTheDocument();
  });

  it("shows loading while user is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    render(
      <MemoryRouter>
        <SetupWhatsAppPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/pages/SetupWhatsAppPage.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write `src/pages/SetupWhatsAppPage.tsx`**

```tsx
// src/pages/SetupWhatsAppPage.tsx
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";

export function SetupWhatsAppPage() {
  const user = useQuery(api.users.currentUser);
  const createInstance = useAction(api.evolution.createInstance);
  const navigate = useNavigate();

  const [isCreating, setIsCreating] = useState(false);

  // Loading
  if (user === undefined) {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Already has instance → go to connect
  if (user?.instanceCreated) {
    return <Navigate to="/whatsapp/connect" replace />;
  }

  const handleCreate = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      // Generate instance name from user ID (last 8 chars)
      const shortId = user._id.slice(-8);
      const instanceName = `hub_${shortId}`;
      await createInstance({ instanceName });
      toast.success("WhatsApp instance created!");
      navigate("/whatsapp/connect");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create instance",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Smartphone className="w-7 h-7 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Setup</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Connect Your WhatsApp
        </h2>
        <p className="text-gray-600 mb-6">
          Create a WhatsApp instance to start sending messages. You'll scan a QR
          code with your phone in the next step.
        </p>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Create Instance"
        >
          {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
          {isCreating ? "Creating..." : "Create Instance"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/pages/SetupWhatsAppPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/SetupWhatsAppPage.tsx src/__tests__/pages/SetupWhatsAppPage.test.tsx
git commit -m "feat: add SetupWhatsAppPage for creating Evolution API instance"
```

---

## Task 7: ConnectWhatsAppPage

Displays the QR code, polls connection status every 5 seconds, and auto-redirects when WhatsApp connects.

**Files:**
- Create: `src/pages/ConnectWhatsAppPage.tsx`
- Create: `src/__tests__/pages/ConnectWhatsAppPage.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
// src/__tests__/pages/ConnectWhatsAppPage.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ConnectWhatsAppPage } from "@/pages/ConnectWhatsAppPage";

const mockUseQuery = vi.fn();
const mockUseAction = vi.fn();
const mockNavigate = vi.fn();

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useAction: () => mockUseAction(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("ConnectWhatsAppPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAction.mockReturnValue(vi.fn());
  });

  it("shows loading while user is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    render(
      <MemoryRouter>
        <ConnectWhatsAppPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("redirects to setup if no instance created", () => {
    mockUseQuery.mockReturnValue({ instanceCreated: false });

    render(
      <MemoryRouter initialEntries={["/whatsapp/connect"]}>
        <ConnectWhatsAppPage />
      </MemoryRouter>,
    );

    // Should redirect — no QR heading visible
    expect(
      screen.queryByRole("heading", { name: /scan qr code/i }),
    ).not.toBeInTheDocument();
  });

  it("renders QR code heading when instance exists", () => {
    mockUseQuery.mockReturnValue({
      instanceCreated: true,
      whatsappConnected: false,
      evolutionInstanceName: "hub_abc12345",
    });

    render(
      <MemoryRouter>
        <ConnectWhatsAppPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /scan qr code/i }),
    ).toBeInTheDocument();
  });

  it("redirects to /send when already connected", () => {
    mockUseQuery.mockReturnValue({
      instanceCreated: true,
      whatsappConnected: true,
      evolutionInstanceName: "hub_abc12345",
    });

    render(
      <MemoryRouter initialEntries={["/whatsapp/connect"]}>
        <ConnectWhatsAppPage />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("heading", { name: /scan qr code/i }),
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/pages/ConnectWhatsAppPage.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write `src/pages/ConnectWhatsAppPage.tsx`**

```tsx
// src/pages/ConnectWhatsAppPage.tsx
import { useState, useEffect, useCallback } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2, QrCode, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function ConnectWhatsAppPage() {
  const user = useQuery(api.users.currentUser);
  const getQrCode = useAction(api.evolution.getQrCode);
  const checkStatus = useAction(api.evolution.checkConnectionStatus);
  const navigate = useNavigate();

  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [error, setError] = useState("");

  const instanceName = user?.evolutionInstanceName;

  // Fetch QR code
  const fetchQr = useCallback(async () => {
    if (!instanceName) return;
    setIsLoadingQr(true);
    setError("");
    try {
      const data = await getQrCode({ instanceName });
      // Evolution API returns { base64: "data:image/png;base64,..." } or { code: "..." }
      setQrBase64(data.base64 || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load QR code");
    } finally {
      setIsLoadingQr(false);
    }
  }, [instanceName, getQrCode]);

  // Fetch QR on mount
  useEffect(() => {
    if (instanceName && !user?.whatsappConnected) {
      fetchQr();
    }
  }, [instanceName, user?.whatsappConnected, fetchQr]);

  // Poll connection status every 5 seconds
  useEffect(() => {
    if (!instanceName || user?.whatsappConnected) return;

    const interval = setInterval(async () => {
      try {
        const result = await checkStatus({ instanceName });
        if (result.state === "open") {
          toast.success("WhatsApp connected!");
          navigate("/send");
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [instanceName, user?.whatsappConnected, checkStatus, navigate]);

  // Loading user
  if (user === undefined) {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // No instance → setup
  if (!user?.instanceCreated) {
    return <Navigate to="/whatsapp/setup" replace />;
  }

  // Already connected → send
  if (user.whatsappConnected) {
    return <Navigate to="/send" replace />;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <QrCode className="w-7 h-7 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-900">Scan QR Code</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-lg mx-auto text-center">
        <p className="text-gray-600 mb-6">
          Open WhatsApp on your phone → Settings → Linked Devices → Link a
          Device → Scan the code below.
        </p>

        {/* QR Code Display */}
        <div className="w-64 h-64 mx-auto mb-6 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
          {isLoadingQr ? (
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          ) : error ? (
            <p className="text-sm text-red-500 px-4">{error}</p>
          ) : qrBase64 ? (
            <img
              src={qrBase64}
              alt="WhatsApp QR Code"
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <p className="text-sm text-gray-400">No QR code available</p>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchQr}
          disabled={isLoadingQr}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingQr ? "animate-spin" : ""}`} />
          Refresh QR Code
        </button>

        <p className="text-xs text-gray-400 mt-4">
          QR code expires after ~60 seconds. Click refresh if it doesn't scan.
        </p>

        {/* Polling indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          Waiting for connection...
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/pages/ConnectWhatsAppPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/ConnectWhatsAppPage.tsx src/__tests__/pages/ConnectWhatsAppPage.test.tsx
git commit -m "feat: add ConnectWhatsAppPage with QR display and status polling"
```

---

## Task 8: MediaUpload Component

File input with client-side validation (type + size), Convex storage upload, and image/video preview.

**Files:**
- Create: `src/components/MediaUpload.tsx`
- Create: `src/__tests__/components/MediaUpload.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
// src/__tests__/components/MediaUpload.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MediaUpload } from "@/components/MediaUpload";

const mockUseMutation = vi.fn();
vi.mock("convex/react", () => ({
  useMutation: () => mockUseMutation(),
}));

describe("MediaUpload", () => {
  const mockOnUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock generateUploadUrl mutation to return a mock fn
    mockUseMutation.mockReturnValue(vi.fn().mockResolvedValue("https://upload.url"));
  });

  it("renders file input and upload button", () => {
    render(<MediaUpload onUpload={mockOnUpload} />);

    expect(screen.getByLabelText(/attach media/i)).toBeInTheDocument();
  });

  it("shows accepted file types hint", () => {
    render(<MediaUpload onUpload={mockOnUpload} />);

    expect(screen.getByText(/images, videos, documents/i)).toBeInTheDocument();
  });

  it("shows file name after selection", () => {
    render(<MediaUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/attach media/i) as HTMLInputElement;
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("photo.jpg")).toBeInTheDocument();
  });

  it("shows error for oversized files (>16MB)", () => {
    render(<MediaUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/attach media/i) as HTMLInputElement;
    // Create a file object with a large size
    const file = new File(["x"], "big.mp4", { type: "video/mp4" });
    Object.defineProperty(file, "size", { value: 17 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText(/file too large/i)).toBeInTheDocument();
  });

  it("allows removing selected file", () => {
    render(<MediaUpload onUpload={mockOnUpload} />);

    const input = screen.getByLabelText(/attach media/i) as HTMLInputElement;
    const file = new File(["test"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByText("photo.jpg")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(screen.queryByText("photo.jpg")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/MediaUpload.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write `src/components/MediaUpload.tsx`**

```tsx
// src/components/MediaUpload.tsx
import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2, Paperclip, X, FileImage, FileVideo, File } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";

const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
  "audio/mpeg",
  "audio/ogg",
];

type MediaType = "image" | "video" | "document" | "audio";

function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
}

function MediaIcon({ mediaType }: { mediaType: MediaType }) {
  switch (mediaType) {
    case "image":
      return <FileImage className="w-5 h-5 text-blue-500" />;
    case "video":
      return <FileVideo className="w-5 h-5 text-purple-500" />;
    default:
      return <File className="w-5 h-5 text-gray-500" />;
  }
}

interface MediaUploadProps {
  onUpload: (data: {
    storageId: Id<"_storage">;
    mediaType: MediaType;
    fileName: string;
  }) => void;
}

export function MediaUpload({ onUpload }: MediaUploadProps) {
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setUploaded(false);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum size is 16MB.");
      setSelectedFile(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Unsupported file type.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError("");
    try {
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!res.ok) throw new Error("Upload failed");

      const { storageId } = await res.json();
      setUploaded(true);
      onUpload({
        storageId,
        mediaType: getMediaType(selectedFile.type),
        fileName: selectedFile.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setError("");
    setUploaded(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="media-upload"
        className="block text-sm font-medium text-gray-700"
      >
        Attach Media
      </label>

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          id="media-upload"
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          aria-label="Attach Media"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {selectedFile && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <MediaIcon mediaType={getMediaType(selectedFile.type)} />
          <span className="text-sm text-gray-700 flex-1 truncate">
            {selectedFile.name}
          </span>
          <span className="text-xs text-gray-400">
            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
          </span>

          {!uploaded && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Upload"
              )}
            </button>
          )}

          {uploaded && (
            <span className="text-xs text-green-600 font-medium">Uploaded</span>
          )}

          <button
            onClick={handleRemove}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Images, videos, documents up to 16MB
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/MediaUpload.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/MediaUpload.tsx src/__tests__/components/MediaUpload.test.tsx
git commit -m "feat: add MediaUpload component with validation and Convex storage"
```

---

## Task 9: SendMessagePage

Contact selector, message textarea, optional media upload, send button. Calls `sendText` or `sendMedia` action, logs the message.

**Files:**
- Create: `src/pages/SendMessagePage.tsx`
- Create: `src/__tests__/pages/SendMessagePage.test.tsx`

- [ ] **Step 1: Write the test file**

```tsx
// src/__tests__/pages/SendMessagePage.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SendMessagePage } from "@/pages/SendMessagePage";

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();
const mockUseAction = vi.fn();
const mockUsePaginatedQuery = vi.fn();

vi.mock("convex/react", () => ({
  useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: () => mockUseMutation(),
  useAction: () => mockUseAction(),
  usePaginatedQuery: (...args: any[]) => mockUsePaginatedQuery(...args),
}));

describe("SendMessagePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      _id: "user123",
      instanceCreated: true,
      whatsappConnected: true,
      evolutionInstanceName: "hub_abc12345",
    });
    mockUseMutation.mockReturnValue(vi.fn());
    mockUseAction.mockReturnValue(vi.fn());
    mockUsePaginatedQuery.mockReturnValue({
      results: [
        { _id: "c1", phone: "+5491112345678", name: "Alice" },
        { _id: "c2", phone: "+5491187654321", name: "Bob" },
      ],
      status: "Exhausted",
      isLoading: false,
      loadMore: vi.fn(),
    });
  });

  it("renders page heading", () => {
    render(
      <MemoryRouter>
        <SendMessagePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /send message/i }),
    ).toBeInTheDocument();
  });

  it("renders contact selector with contacts", () => {
    render(
      <MemoryRouter>
        <SendMessagePage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/select contact/i)).toBeInTheDocument();
  });

  it("renders message textarea", () => {
    render(
      <MemoryRouter>
        <SendMessagePage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  it("renders send button", () => {
    render(
      <MemoryRouter>
        <SendMessagePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: /send/i }),
    ).toBeInTheDocument();
  });

  it("send button is disabled when no contact or message", () => {
    render(
      <MemoryRouter>
        <SendMessagePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("shows loading when user is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);

    render(
      <MemoryRouter>
        <SendMessagePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/pages/SendMessagePage.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write `src/pages/SendMessagePage.tsx`**

```tsx
// src/pages/SendMessagePage.tsx
import { useState, useCallback } from "react";
import { useQuery, useAction, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { MediaUpload } from "@/components/MediaUpload";
import type { Id } from "@convex/_generated/dataModel";

type MediaData = {
  storageId: Id<"_storage">;
  mediaType: "image" | "video" | "document" | "audio";
  fileName: string;
};

export function SendMessagePage() {
  const user = useQuery(api.users.currentUser);
  const contacts = usePaginatedQuery(api.contacts.list, {}, { initialNumItems: 200 });
  const sendText = useAction(api.evolution.sendText);
  const sendMediaAction = useAction(api.evolution.sendMedia);
  const logMessage = useMutation(api.messages.logMessage);

  const [selectedPhone, setSelectedPhone] = useState("");
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState<MediaData | null>(null);
  const [isSending, setIsSending] = useState(false);

  const instanceName = user?.evolutionInstanceName;

  const handleMediaUpload = useCallback((data: MediaData) => {
    setMedia(data);
  }, []);

  const handleSend = useCallback(async () => {
    if (!selectedPhone || !message.trim() || !instanceName) return;

    setIsSending(true);
    try {
      if (media) {
        // Pass storageId to the action — it resolves the URL server-side
        await sendMediaAction({
          instanceName,
          phone: selectedPhone,
          storageId: media.storageId,
          mediaType: media.mediaType,
          caption: message.trim(),
          fileName: media.fileName,
        });
      } else {
        await sendText({
          instanceName,
          phone: selectedPhone,
          message: message.trim(),
        });
      }

      // Log the message
      await logMessage({
        phone: selectedPhone,
        message: message.trim(),
        status: "sent",
      });

      toast.success("Message sent!");
      setMessage("");
      setMedia(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send message",
      );

      // Log failed message
      await logMessage({
        phone: selectedPhone,
        message: message.trim(),
        status: "failed",
      }).catch(() => {}); // Don't throw if logging fails
    } finally {
      setIsSending(false);
    }
  }, [selectedPhone, message, instanceName, media, sendText, sendMedia, logMessage]);

  // Loading
  if (user === undefined) {
    return (
      <div role="status" className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const canSend = selectedPhone && message.trim() && !isSending;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Send className="w-7 h-7 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-900">Send Message</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
        <div className="space-y-4">
          {/* Contact Selector */}
          <div>
            <label
              htmlFor="contact-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Select Contact
            </label>
            <select
              id="contact-select"
              value={selectedPhone}
              onChange={(e) => setSelectedPhone(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              aria-label="Select Contact"
            >
              <option value="">Choose a contact...</option>
              {contacts.results.map((contact) => (
                <option key={contact._id} value={contact.phone}>
                  {contact.name ? `${contact.name} (${contact.phone})` : contact.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Message Input */}
          <div>
            <label
              htmlFor="message-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Message
            </label>
            <textarea
              id="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Type your message..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-y"
              aria-label="Message"
            />
          </div>

          {/* Media Upload */}
          <MediaUpload onUpload={handleMediaUpload} />

          {/* Send Button */}
          <div className="pt-2">
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Send"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/pages/SendMessagePage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/SendMessagePage.tsx src/__tests__/pages/SendMessagePage.test.tsx
git commit -m "feat: add SendMessagePage with contact selector, message input, and media"
```

---

## Task 10: Add Routes and Nav Links

Wire everything into the router and navbar.

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/AppLayout.tsx`

- [ ] **Step 1: Update `src/App.tsx` — add imports and routes**

Add these imports at the top:
```tsx
import { SetupWhatsAppPage } from "./pages/SetupWhatsAppPage";
import { ConnectWhatsAppPage } from "./pages/ConnectWhatsAppPage";
import { SendMessagePage } from "./pages/SendMessagePage";
import { WhatsAppGuard } from "./components/WhatsAppGuard";
```

Add these `<Route>` elements inside `<Routes>`, after the `/contacts/upload` route:
```tsx
<Route
  path="/whatsapp/setup"
  element={
    <ProtectedRoute>
      <SetupWhatsAppPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/whatsapp/connect"
  element={
    <ProtectedRoute>
      <ConnectWhatsAppPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/send"
  element={
    <ProtectedRoute>
      <WhatsAppGuard>
        <SendMessagePage />
      </WhatsAppGuard>
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 2: Update `src/components/AppLayout.tsx` — add "Send" nav link**

Add a new `<NavLink>` between the "Contacts" link and the logout button:
```tsx
<NavLink
  to="/send"
  className={({ isActive }) =>
    cn(
      "px-3 py-2 text-sm rounded-lg transition-colors",
      isActive
        ? "text-green-600 font-medium bg-green-50"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
    )
  }
>
  Send
</NavLink>
```

- [ ] **Step 3: Run ALL tests to verify nothing broke**

Run: `npx vitest run`
Expected: All tests PASS (existing 69 + new tests)

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/AppLayout.tsx
git commit -m "feat: add WhatsApp routes and Send nav link"
```

---

## Task 11: Set Environment Variables in Convex

The Evolution API actions need `EVOLUTION_API_URL` and `EVOLUTION_API_KEY` in the Convex environment.

- [ ] **Step 1: Set env vars in Convex dashboard**

Run:
```bash
npx convex env set EVOLUTION_API_URL "https://wavolution.agentifycrm.io:8080"
```

Then set the API key (get from Evolution API dashboard at `wavolution.agentifycrm.io:8080`):
```bash
npx convex env set EVOLUTION_API_KEY "<your-evolution-api-key>"
```

- [ ] **Step 2: Push Convex functions**

Run: `npx convex dev --once`
Expected: All new functions deploy successfully

- [ ] **Step 3: Verify in Convex dashboard**

Run: `npx convex dashboard`
Check: `users`, `evolution`, `storage`, `messages` modules visible with correct functions.

---

## Task 12: Manual Verification with Real WhatsApp

- [ ] **Step 1: Start dev server**

Run (in separate terminals):
```bash
npm run dev
npx convex dev
```

- [ ] **Step 2: Log in and navigate to /whatsapp/setup**

Open `http://localhost:5173`, log in with test account, click "Send" in nav (should redirect to setup).

- [ ] **Step 3: Create instance**

Click "Create Instance" button. Verify success toast and redirect to /whatsapp/connect.

- [ ] **Step 4: Scan QR code**

Open WhatsApp on phone → Settings → Linked Devices → Link a Device → Scan QR. Verify auto-redirect to /send after connection.

- [ ] **Step 5: Send a text message**

Select a contact, type a message, click "Send". Verify message arrives on WhatsApp.

- [ ] **Step 6: Send a media message**

Attach an image, add caption, send. Verify image arrives on WhatsApp with caption.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: Phase 3 complete — WhatsApp connection + single messaging"
```
