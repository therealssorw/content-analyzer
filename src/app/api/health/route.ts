import { NextResponse } from "next/server";

export async function GET() {
  const hasAI = !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY);
  const hasSupabase = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasStripe = !!process.env.STRIPE_SECRET_KEY;

  return NextResponse.json({
    status: "ok",
    version: "0.1.0",
    ai: hasAI ? "configured" : "mock",
    auth: hasSupabase ? "configured" : "disabled",
    payments: hasStripe ? "configured" : "disabled",
  });
}
