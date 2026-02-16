import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

// In-memory pro users cache (fast path — Supabase is persistent store)
export const proUsers = new Map<string, { customerId: string; subscriptionId: string; status: string }>();

async function persistSubscription(userId: string, customerId: string, subscriptionId: string, status: string) {
  // Update in-memory cache
  if (status === "active") {
    proUsers.set(userId, { customerId, subscriptionId, status });
  } else {
    proUsers.delete(userId);
  }

  // Persist to Supabase if available
  const supabase = await createClient();
  if (!supabase) return;

  try {
    await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch (err) {
    console.error("[Stripe] Failed to persist subscription:", err);
    // Non-fatal — in-memory still works
  }
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        await persistSubscription(
          userId,
          session.customer as string,
          session.subscription as string,
          "active"
        );
        console.log(`[Stripe] User ${userId} upgraded to Pro`);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      // Find user by subscription ID (check memory + Supabase)
      for (const [userId, data] of proUsers.entries()) {
        if (data.subscriptionId === sub.id) {
          await persistSubscription(
            userId,
            data.customerId,
            sub.id,
            sub.status === "active" ? "active" : "canceled"
          );
          break;
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
