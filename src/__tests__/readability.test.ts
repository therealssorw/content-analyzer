import { describe, it, expect } from "vitest";
import { analyzeReadability } from "../lib/readability";

describe("analyzeReadability", () => {
  it("analyzes short tweet-like content", () => {
    const result = analyzeReadability("Stop trying to go viral. Start trying to be useful.");
    expect(result.wordCount).toBe(10);
    expect(result.sentenceCount).toBe(2);
    expect(result.fleschReadingEase).toBeGreaterThan(50);
    expect(result.readingTimeSeconds).toBeLessThan(10);
  });

  it("analyzes longer article content", () => {
    const text = "The best writers know something most people don't. They understand that writing is not about impressing people with big words. It's about clarity. It's about making the reader feel something. " +
      "When you write a sentence that is excessively long and filled with unnecessary qualifiers and modifiers and conjunctions that don't add meaning, you lose the reader before they even get to your point. " +
      "Short sentences work. They create rhythm. They build momentum.";
    const result = analyzeReadability(text);
    expect(result.wordCount).toBeGreaterThan(50);
    expect(result.sentenceCount).toBeGreaterThan(5);
    expect(result.suggestions.length).toBeGreaterThanOrEqual(0);
    expect(result.gradeLevel).toBeTruthy();
  });

  it("detects long sentences", () => {
    const text = "This is a very long sentence that goes on and on and on and on and on and on and keeps going and never seems to stop because the writer forgot about periods and punctuation and just kept typing words forever.";
    const result = analyzeReadability(text);
    expect(result.longSentences).toBeGreaterThan(0);
  });

  it("handles empty-ish content gracefully", () => {
    const result = analyzeReadability("Hello.");
    expect(result.wordCount).toBe(1);
    expect(result.sentenceCount).toBe(1);
    expect(result.fleschReadingEase).toBeGreaterThan(0);
  });

  it("estimates passive voice", () => {
    const text = "The ball was thrown by the boy. The cake was eaten. The report was written by the team.";
    const result = analyzeReadability(text);
    expect(result.passiveVoiceEstimate).toBeGreaterThan(0);
  });
});
