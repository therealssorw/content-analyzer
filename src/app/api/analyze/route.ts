import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeContent } from "@/lib/ai-providers";
import { sanitizeContent, detectContentType } from "@/lib/content-utils";
import { analyzeReadability } from "@/lib/readability";
import { analyzeTone } from "@/lib/tone-analysis";

// Simple in-memory rate limiter (resets on redeploy — fine for MVP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PER_DAY || "20", 10);
const RATE_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated (skip rate limit for logged-in users)
    const supabase = await createClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;

    if (!user) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
      if (!checkRateLimit(ip)) {
        return NextResponse.json({ error: "Rate limit exceeded. Sign in for unlimited analyses or try again tomorrow." }, { status: 429 });
      }
    }

    const body = await req.json();
    const rawContent = body.content;
    const rawType = body.type;

    if (!rawContent || !rawType) {
      return NextResponse.json({ error: "Content and type are required" }, { status: 400 });
    }

    const content = sanitizeContent(rawContent);

    if (content.length > 15000) {
      return NextResponse.json({ error: "Content too long. Max 15,000 characters." }, { status: 400 });
    }

    if (content.length === 0) {
      return NextResponse.json({ error: "Content cannot be empty." }, { status: 400 });
    }

    // Use provided type, or auto-detect if set to "auto"
    const type = rawType === "auto" ? detectContentType(content) : rawType;

    const { result, provider } = await analyzeContent(content, type);
    const readability = analyzeReadability(content);
    const tone = analyzeTone(content);

    return NextResponse.json({
      ...result,
      readability,
      tone,
      mock: provider === "mock",
      provider,
      detectedType: type,
    });
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
