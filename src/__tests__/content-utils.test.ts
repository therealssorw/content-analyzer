import { describe, it, expect } from "vitest";
import { sanitizeContent, detectContentType, getPreview } from "@/lib/content-utils";

describe("sanitizeContent", () => {
  it("strips control characters", () => {
    expect(sanitizeContent("hello\x00world")).toBe("helloworld");
  });

  it("normalizes line endings", () => {
    expect(sanitizeContent("a\r\nb\rc")).toBe("a\nb\nc");
  });

  it("collapses excessive newlines", () => {
    expect(sanitizeContent("a\n\n\n\n\nb")).toBe("a\n\nb");
  });

  it("trims whitespace", () => {
    expect(sanitizeContent("  hello  ")).toBe("hello");
  });
});

describe("detectContentType", () => {
  it("detects short text as tweet", () => {
    expect(detectContentType("This is a short post")).toBe("tweet");
  });

  it("detects 280-char text as tweet", () => {
    expect(detectContentType("A".repeat(280))).toBe("tweet");
  });

  it("detects long text as article", () => {
    const words = Array(250).fill("word").join(" ");
    expect(detectContentType(words)).toBe("article");
  });

  it("detects multi-line content as article", () => {
    const lines = Array(12).fill("This is a line of text.").join("\n");
    expect(detectContentType(lines)).toBe("article");
  });
});

describe("getPreview", () => {
  it("returns full first line if short", () => {
    expect(getPreview("Short line\nMore text")).toBe("Short line");
  });

  it("truncates long first lines", () => {
    const long = "A".repeat(200);
    const preview = getPreview(long, 120);
    expect(preview.length).toBe(120);
    expect(preview.endsWith("...")).toBe(true);
  });
});
