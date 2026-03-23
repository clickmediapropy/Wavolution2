import { describe, it, expect } from "vite-plus/test";

describe("convex/users", () => {
  it("exports currentUser query", async () => {
    const mod = await import("@convex/users");
    expect(mod.currentUser).toBeDefined();
  });
});

describe("convex/instances", () => {
  it("exports list query", async () => {
    const mod = await import("@convex/instances");
    expect(mod.list).toBeDefined();
  });

  it("exports create mutation", async () => {
    const mod = await import("@convex/instances");
    expect(mod.create).toBeDefined();
  });

  it("exports listConnected query", async () => {
    const mod = await import("@convex/instances");
    expect(mod.listConnected).toBeDefined();
  });
});
