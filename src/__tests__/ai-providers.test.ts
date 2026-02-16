import { describe, it, expect, vi, beforeEach } from "vitest";
import { getMockAnalysis } from "@/lib/ai-providers";

describe("getMockAnalysis", () => {
  it("returns valid structure for tweet type", () => {
    const result = getMockAnalysis("This is a test tweet", "tweet");
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("hookStrength");
    expect(result).toHaveProperty("structure");
    expect(result).toHaveProperty("emotionalTriggers");
    expect(result).toHaveProperty("improvements");
    expect(result).toHaveProperty("summary");
    expect(result.overallScore).toBeGreaterThanOrEqual(1);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.improvements.length).toBeGreaterThanOrEqual(1);
    expect(result.emotionalTriggers.triggers.length).toBeGreaterThanOrEqual(1);
  });

  it("returns valid structure for article type", () => {
    const result = getMockAnalysis("This is a longer article about writing...", "article");
    expect(result.overallScore).toBeGreaterThanOrEqual(1);
    expect(result.hookStrength.score).toBeGreaterThanOrEqual(1);
    expect(result.structure.score).toBeGreaterThanOrEqual(1);
    expect(result.emotionalTriggers.score).toBeGreaterThanOrEqual(1);
  });

  it("scores higher for content with questions", () => {
    const withQ = getMockAnalysis("Why do people fail at writing? Here's the secret.", "tweet");
    const withoutQ = getMockAnalysis("People fail at writing. Here is the secret.", "tweet");
    expect(withQ.overallScore).toBeGreaterThan(withoutQ.overallScore);
  });

  it("scores higher for content with numbers", () => {
    const withNum = getMockAnalysis("5 ways to improve your writing today", "tweet");
    const withoutNum = getMockAnalysis("Ways to improve your writing today", "tweet");
    expect(withNum.overallScore).toBeGreaterThan(withoutNum.overallScore);
  });

  it("scores higher for longer content", () => {
    const long = getMockAnalysis("A".repeat(150), "tweet");
    const short = getMockAnalysis("Short", "tweet");
    expect(long.overallScore).toBeGreaterThan(short.overallScore);
  });

  it("caps score at 95", () => {
    // Content with everything: long, question, numbers, emoji
    const result = getMockAnalysis("A".repeat(200) + "? 123 😀", "tweet");
    expect(result.overallScore).toBeLessThanOrEqual(95);
  });

  it("floors score at 35", () => {
    const result = getMockAnalysis("", "tweet");
    expect(result.overallScore).toBeGreaterThanOrEqual(35);
  });
});
