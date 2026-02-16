import { describe, it, expect } from "vitest";
import { analyzeTone } from "../lib/tone-analysis";

describe("analyzeTone", () => {
  it("detects casual tone", () => {
    const result = analyzeTone("lol tbh this is gonna be wild. you're not ready for this ngl");
    expect(result.formality.level).toBe("casual");
    expect(result.formality.score).toBeLessThan(30);
  });

  it("detects formal/academic tone", () => {
    const result = analyzeTone(
      "Furthermore, the analysis notwithstanding the aforementioned constraints, nevertheless demonstrates that the methodology is robust. Moreover, one might argue that the implications are significant. Thus, it is worth noting the consequent ramifications."
    );
    expect(["professional", "academic"]).toContain(result.formality.level);
    expect(result.formality.score).toBeGreaterThan(50);
  });

  it("detects tentative confidence", () => {
    const result = analyzeTone(
      "I think maybe this could possibly work. Perhaps it might help somewhat. I guess it sort of makes sense, kind of."
    );
    expect(result.confidence.level).toBe("tentative");
    expect(result.confidence.score).toBeLessThan(30);
  });

  it("detects assertive confidence", () => {
    const result = analyzeTone(
      "Here's the thing. You must stop doing this. The truth is, it's obviously the wrong approach. Let me be clear: this will definitely change everything."
    );
    expect(["assertive", "authoritative"]).toContain(result.confidence.level);
    expect(result.confidence.score).toBeGreaterThan(55);
  });

  it("detects personality traits", () => {
    const result = analyzeTone(
      "Step 1: Look at the data. Research shows 73% of creators fail because they don't have a system. Here's my exact framework and process."
    );
    expect(result.personality).toContain("data-driven");
    expect(result.personality).toContain("systematic");
  });

  it("assigns a voice archetype", () => {
    const result = analyzeTone(
      "I remember when I failed spectacularly. True story — I lost everything. But honestly, that mistake taught me the most important lesson."
    );
    expect(result.voice).toBeTruthy();
    expect(result.voice).not.toBe("Unknown");
  });

  it("provides suggestions", () => {
    const result = analyzeTone("Maybe this is sort of okay I guess. Perhaps it could possibly be somewhat useful.");
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("handles empty content", () => {
    const result = analyzeTone("");
    expect(result.voice).toBe("Unknown");
    expect(result.formality.score).toBe(50);
  });
});
