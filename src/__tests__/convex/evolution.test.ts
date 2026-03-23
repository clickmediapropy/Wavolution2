import { describe, it, expect } from "vite-plus/test";

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
