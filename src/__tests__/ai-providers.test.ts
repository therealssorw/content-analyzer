import { describe, it, expect } from "vitest";
import { getMockAnalysis } from "@/lib/ai-providers";

describe("getMockAnalysis", () => {
  it("returns valid structure for tweet type", () => {
    const result = getMockAnalysis("Why do most people fail at writing? Here's what I learned.", "tweet");
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("hookStrength");
    expect(result).toHaveProperty("structure");
    expect(result).toHaveProperty("emotionalTriggers");
    expect(result).toHaveProperty("improvements");
    expect(result).toHaveProperty("summary");
    expect(result.overallScore).toBeGreaterThanOrEqual(1);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.improvements.length).toBeGreaterThanOrEqual(1);
  });

  it("returns valid structure for article type", () => {
    const result = getMockAnalysis("This is a longer article about writing and why it matters for your career.", "article");
    expect(result.overallScore).toBeGreaterThanOrEqual(1);
    expect(result.hookStrength.score).toBeGreaterThanOrEqual(1);
    expect(result.structure.score).toBeGreaterThanOrEqual(1);
    expect(result.emotionalTriggers.score).toBeGreaterThanOrEqual(1);
  });

  it("scores higher for content with questions", () => {
    const withQ = getMockAnalysis("Why do people fail at writing? Here's the secret nobody shares.", "tweet");
    const withoutQ = getMockAnalysis("People fail at writing. Here is a fact.", "tweet");
    expect(withQ.overallScore).toBeGreaterThan(withoutQ.overallScore);
  });

  it("scores higher for content with hook techniques", () => {
    const strong = getMockAnalysis("7 shocking mistakes that kill your writing career — and what to do instead", "tweet");
    const weak = getMockAnalysis("Writing is important for everyone", "tweet");
    expect(strong.overallScore).toBeGreaterThan(weak.overallScore);
  });

  it("detects emotional triggers", () => {
    const result = getMockAnalysis("I admit I was terrified of failure. But this secret discovery changed everything. You won't believe the proven data.", "tweet");
    expect(result.emotionalTriggers.triggers.length).toBeGreaterThanOrEqual(2);
  });

  it("caps score at 98", () => {
    const result = getMockAnalysis("Why do 97% of writers secretly fail? I discovered the shocking truth after years of painful struggle. You need to hear this now.", "tweet");
    expect(result.overallScore).toBeLessThanOrEqual(98);
  });

  it("floors score at 15", () => {
    const result = getMockAnalysis("ok", "tweet");
    expect(result.overallScore).toBeGreaterThanOrEqual(15);
  });
});
