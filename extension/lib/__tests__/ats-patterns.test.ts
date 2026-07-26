import { describe, it, expect } from "vitest";
import { ATS_PLATFORMS, matchAtsPattern } from "../ats-patterns.js";

describe("ATS Platforms Pattern Matcher", () => {
  it("has pattern rules configured for major ATS platforms", () => {
    const names = ATS_PLATFORMS.map((p) => p.name);
    expect(names).toContain("Greenhouse");
    expect(names).toContain("Lever");
    expect(names).toContain("Workday");
    expect(names).toContain("Ashby");
    expect(names).toContain("iCIMS");
  });

  it("detects Greenhouse URL", () => {
    const greenhouseUrl = "https://boards.greenhouse.io/acme/jobs/12345";
    const match = matchAtsPattern(greenhouseUrl, { querySelector: () => null } as any);
    expect(match).not.toBeNull();
    expect(match?.platform).toBe("Greenhouse");
  });

  it("detects Lever URL", () => {
    const leverUrl = "https://jobs.lever.co/acme/abcdef-123456";
    const match = matchAtsPattern(leverUrl, { querySelector: () => null } as any);
    expect(match).not.toBeNull();
    expect(match?.platform).toBe("Lever");
  });

  it("returns null for unknown URL", () => {
    const customUrl = "https://example.com/careers";
    const match = matchAtsPattern(customUrl, { querySelector: () => null } as any);
    expect(match).toBeNull();
  });
});
