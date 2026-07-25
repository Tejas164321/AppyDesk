import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../firebase-admin", () => ({ adminDb: null }));

import { checkDuplicateApplication } from "../dedupe";

describe("Deduplication Checker Helper", () => {
  it("should return isDuplicate false when fallback adminDb is null", async () => {
    const result = await checkDuplicateApplication("user123", "hr@acme.com", "Acme Corp", 30);
    expect(result.isDuplicate).toBe(false);
  });
});
