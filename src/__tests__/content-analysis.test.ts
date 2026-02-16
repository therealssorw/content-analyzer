import { describe, it, expect } from "vitest";
import { analyzeHook, analyzeStructure, analyzeEmotions, runSmartAnalysis } from "../lib/content-analysis";

describe("analyzeHook", () => {
  it("detects question hooks", () => {
    const result = analyzeHook("Why do most startups fail in the first year?", "tweet");
    expect(result.techniques).toContain("Question Hook");
    expect(result.score).toBeGreaterThan(55);
  });

  it("detects listicle hooks", () => {
    const result = analyzeHook("7 mistakes every new writer makes", "article");
    expect(result.techniques).toContain("Listicle Hook");
    expect(result.techniques).toContain("Numeric Lead");
  });

  it("detects power words", () => {
    const result = analyzeHook("The shocking truth about your morning routine", "tweet");
    expect(result.techniques).toContain("Power Words");
  });

  it("scores weak hooks lower", () => {
    const weak = analyzeHook("Hello here is my post", "tweet");
    const strong = analyzeHook("Why 97% of creators fail (and the 3% secret nobody talks about)", "tweet");
    expect(strong.score).toBeGreaterThan(weak.score);
  });
});

describe("analyzeStructure", () => {
  it("rewards line breaks in tweets", () => {
    const withBreaks = analyzeStructure("Line one\n\nLine two\n\nLine three", "tweet");
    const without = analyzeStructure("One long sentence without breaks", "tweet");
    expect(withBreaks.score).toBeGreaterThan(without.score);
  });

  it("rewards subheadings in articles", () => {
    const withHeadings = analyzeStructure("# Intro\n\nSome text\n\n## Section 1\n\nMore text\n\n## Section 2\n\nEnd", "article");
    expect(withHeadings.score).toBeGreaterThan(60);
  });
});

describe("analyzeEmotions", () => {
  it("detects multiple triggers", () => {
    const result = analyzeEmotions("I admit I failed at this for years. The secret nobody told me was simple. You can do this too — here's the proven data.");
    expect(result.triggers.length).toBeGreaterThanOrEqual(3);
    expect(result.triggers).toContain("Vulnerability");
    expect(result.triggers).toContain("Curiosity");
  });

  it("scores flat content lower", () => {
    const flat = analyzeEmotions("The weather is nice today. It is sunny.");
    const rich = analyzeEmotions("I was terrified of failure. But this secret discovery transformed my entire approach. You won't believe the data.");
    expect(rich.score).toBeGreaterThan(flat.score);
  });
});

describe("runSmartAnalysis", () => {
  it("returns complete analysis structure", () => {
    const result = runSmartAnalysis("Why do 90% of newsletters fail? I spent 3 years studying the top 1% and found 5 patterns they all share.", "article");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.hookStrength.score).toBeGreaterThan(0);
    expect(result.structure.score).toBeGreaterThan(0);
    expect(result.emotionalTriggers.triggers.length).toBeGreaterThan(0);
    expect(result.improvements.length).toBeGreaterThan(0);
    expect(result.summary).toBeTruthy();
  });

  it("scores strong content higher than weak content", () => {
    const strong = runSmartAnalysis(
      "Why 97% of writers quit (and the shocking 3-step secret that saved my career)\n\nI was ready to give up. After 2 years of writing, I had 47 subscribers.\n\nThen I discovered something that changed everything.\n\n## The Pattern Nobody Talks About\n\nResearch shows that the top 1% of creators share 3 habits...\n\nWhat do you think — have you seen this pattern?",
      "article"
    );
    const weak = runSmartAnalysis("Here is my post about writing. Writing is good. You should write more.", "article");
    expect(strong.overallScore).toBeGreaterThan(weak.overallScore + 10);
  });
});
