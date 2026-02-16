import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { proUsers } from "../webhook/route";

export async function GET() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    return NextResponse.json({ pro: false, reason: "not_authenticated" });
  }

  // Check in-memory cache first (fast path)
  const memSub = proUsers.get(user.id);
  if (memSub?.status === "active") {
    return NextResponse.json({ pro: true, plan: "pro" });
  }

  // Check Supabase subscriptions table (persistent)
  if (supabase) {
    try {
      const { data } = await supabase
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (data) {
        // Cache it in memory for fast subsequent checks
        proUsers.set(user.id, {
          customerId: "",
          subscriptionId: "",
          status: "active",
        });
        return NextResponse.json({ pro: true, plan: "pro" });
      }
    } catch {
      // Table might not exist yet — that's fine
    }
  }

  return NextResponse.json({ pro: false, plan: "free" });
}
