import { describe, it, expect } from "vitest";

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
