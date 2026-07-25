import { describe, it, expect } from "vitest";
import { calculateMatchScore } from "../extract-engine";

describe("Extraction Engine - Match Score Calculation", () => {
  it("should return high match score when summary overlaps strongly with key requirements", () => {
    const keyRequirements = ["TypeScript", "React", "Next.js", "GraphQL"];
    const summary = "Senior Full-Stack Engineer with 5+ years experience building TypeScript, React, Next.js, and GraphQL applications.";

    const score = calculateMatchScore(keyRequirements, summary);
    expect(score).toBeGreaterThanOrEqual(80);
    expect(score).toBeLessThanOrEqual(98);
  });

  it("should return moderate/low score when summary has minimal overlap", () => {
    const keyRequirements = ["Rust", "C++", "Embedded Systems", "Hardware Drivers"];
    const summary = "Frontend UI Designer specialized in Figma, CSS animations, and HTML templates.";

    const score = calculateMatchScore(keyRequirements, summary);
    expect(score).toBeLessThan(65);
  });

  it("should handle empty inputs gracefully without throwing errors", () => {
    const score = calculateMatchScore([], "");
    expect(score).toBeGreaterThanOrEqual(45);
  });
});
