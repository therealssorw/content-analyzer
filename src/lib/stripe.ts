import Stripe from "stripe";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2025-01-27.acacia" as Stripe.LatestApiVersion });
}

export const PLANS = {
  free: {
    name: "Free",
    analysesPerMonth: 5,
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID || "",
    analysesPerMonth: Infinity,
  },
} as const;
