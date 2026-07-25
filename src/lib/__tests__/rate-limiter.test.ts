import { describe, it, expect, vi } from "vitest";

// Mock server-only to prevent vitest error in test mode
vi.mock("server-only", () => ({}));
vi.mock("../firebase-admin", () => ({ adminDb: null }));

import { checkAndUpdateRateLimit } from "../rate-limiter";

describe("Server Rate Limiter Helper", () => {
  it("should allow sending when fallback adminDb is null", async () => {
    const result = await checkAndUpdateRateLimit("user123", 15);
    expect(result.allowed).toBe(true);
    expect(result.dailyCap).toBe(15);
  });
});
