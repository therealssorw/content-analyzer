import { NextRequest, NextResponse } from "next/server";
import { analyzeContent } from "@/lib/ai-providers";
import { sanitizeContent, detectContentType } from "@/lib/content-utils";
import { analyzeReadability } from "@/lib/readability";
import { analyzeTone } from "@/lib/tone-analysis";
import { getUserTier, saveAnalysis } from "@/lib/supabase/pro-check";

export async function POST(req: NextRequest) {
  try {
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

    // Check user tier and rate limits
    const tier = await getUserTier();
    if (tier.userId && tier.analysesUsedToday >= tier.dailyLimit) {
      return NextResponse.json(
        {
          error: tier.isPro
            ? "Daily analysis limit reached. Try again tomorrow."
            : "Free tier limit reached (3/day). Upgrade to Pro for 100 analyses/day.",
          upgrade: !tier.isPro,
        },
        { status: 429 }
      );
    }

    const type = rawType === "auto" ? detectContentType(content) : rawType;
    const { result, provider } = await analyzeContent(content, type);
    const readability = analyzeReadability(content);
    const tone = analyzeTone(content);

    const responseData = {
      ...result,
      readability,
      tone,
      mock: provider === "mock",
      provider,
      detectedType: type,
    };

    // Save analysis to history for logged-in users
    if (tier.userId) {
      saveAnalysis(tier.userId, content, type, responseData).catch(() => {});
    }

    return NextResponse.json(responseData);
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
