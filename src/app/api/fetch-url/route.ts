import { NextRequest, NextResponse } from "next/server";

/**
 * Fetch article content from a URL (Substack, Medium, blog posts).
 * Extracts readable text from HTML — no API key needed.
 */
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Only HTTP/HTTPS URLs supported" }, { status: 400 });
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ContentLens/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch URL (${response.status})` }, { status: 502 });
    }

    const html = await response.text();

    // Extract readable content from HTML
    const content = extractContent(html);

    if (!content || content.length < 50) {
      return NextResponse.json({ error: "Could not extract readable content from this URL" }, { status: 422 });
    }

    // Extract title if available
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? decodeHTMLEntities(titleMatch[1].trim()) : undefined;

    return NextResponse.json({
      content: content.slice(0, 15000),
      title,
      source: parsed.hostname,
      charCount: content.length,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json({ error: "URL fetch timed out" }, { status: 504 });
    }
    console.error("URL fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch URL" }, { status: 500 });
  }
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractContent(html: string): string {
  // Remove scripts, styles, nav, header, footer, sidebar
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Try to find article content (Substack, Medium, generic article tags)
  const articlePatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*(?:post-content|article-content|entry-content|body-markup|markup)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*available-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of articlePatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      const text = htmlToText(match[1]);
      if (text.length > 100) return text;
    }
  }

  // Fallback: extract all paragraphs
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;
  while ((pMatch = pRegex.exec(cleaned)) !== null) {
    const text = stripTags(pMatch[1]).trim();
    if (text.length > 20) paragraphs.push(text);
  }

  if (paragraphs.length >= 2) {
    return paragraphs.join("\n\n");
  }

  // Last resort: strip all tags from main/body
  const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) return htmlToText(mainMatch[1]);

  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) return htmlToText(bodyMatch[1]).slice(0, 15000);

  return "";
}

function htmlToText(html: string): string {
  return html
    // Convert block elements to newlines
    .replace(/<\/?(p|div|h[1-6]|li|br|blockquote)[^>]*>/gi, "\n")
    // Convert list items
    .replace(/<li[^>]*>/gi, "\n• ")
    // Strip remaining tags
    .replace(/<[^>]+>/g, "")
    // Decode entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    // Clean up whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
