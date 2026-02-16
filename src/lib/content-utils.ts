/**
 * Content utility functions for sanitization and auto-detection.
 */

/**
 * Sanitize user input — strip control chars, normalize whitespace.
 */
export function sanitizeContent(raw: string): string {
  return raw
    // Remove null bytes and other control characters (keep newlines/tabs)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Collapse 3+ consecutive newlines to 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Auto-detect content type based on heuristics.
 * Returns "tweet" for short-form, "article" for long-form.
 */
export function detectContentType(content: string): "tweet" | "article" {
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  const charCount = content.length;
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  // Thread detection: numbered lines like "1/" "2/" or "1." "2."
  const threadPattern = /^(\d+[.\/)]|\u2022|\-)\s/;
  const threadLines = lines.filter((l) => threadPattern.test(l.trim())).length;
  const isThread = threadLines >= 3;

  // Short-form heuristics
  if (charCount <= 280) return "tweet";
  if (charCount <= 600 && !isThread && lines.length <= 5) return "tweet";

  // Long-form heuristics
  if (wordCount > 200) return "article";
  if (lines.length > 10) return "article";

  // Default based on length
  return charCount > 500 ? "article" : "tweet";
}

/**
 * Extract a preview snippet from content (for history/display).
 */
export function getPreview(content: string, maxLen: number = 120): string {
  const firstLine = content.split("\n")[0] || "";
  if (firstLine.length <= maxLen) return firstLine;
  return firstLine.slice(0, maxLen - 3) + "...";
}
