import { createClient } from "./server";

export interface UserTier {
  isPro: boolean;
  userId: string | null;
  email: string | null;
  analysesUsedToday: number;
  dailyLimit: number;
}

const FREE_DAILY_LIMIT = 3;
const PRO_DAILY_LIMIT = 100;

/**
 * Check if the current user has Pro tier access.
 * Falls back gracefully if Supabase/Stripe aren't configured.
 */
export async function getUserTier(): Promise<UserTier> {
  const defaultTier: UserTier = {
    isPro: false,
    userId: null,
    email: null,
    analysesUsedToday: 0,
    dailyLimit: FREE_DAILY_LIMIT,
  };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return defaultTier;

    // Check if user has an active subscription in the subscriptions table
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, stripe_subscription_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    const isPro = !!subscription;

    // Count today's analyses
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00Z`);

    return {
      isPro,
      userId: user.id,
      email: user.email ?? null,
      analysesUsedToday: count ?? 0,
      dailyLimit: isPro ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT,
    };
  } catch {
    // Supabase not configured — allow unlimited free access
    return defaultTier;
  }
}

/**
 * Save an analysis result to the user's history.
 */
export async function saveAnalysis(
  userId: string,
  content: string,
  contentType: string,
  result: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("analyses").insert({
      user_id: userId,
      content_preview: content.slice(0, 500),
      content_type: contentType,
      overall_score: (result as { overallScore?: number }).overallScore ?? 0,
      result_json: result,
    });
  } catch {
    // Silently fail if table doesn't exist yet
  }
}
