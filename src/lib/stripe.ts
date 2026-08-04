import Stripe from "stripe";

export type StripeBillingInterval = "monthly" | "yearly";

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim()
      && (
        process.env.STRIPE_MONTHLY_PRICE_ID?.trim()
        || process.env.STRIPE_YEARLY_PRICE_ID?.trim()
        || process.env.STRIPE_PRICE_ID?.trim()
      ),
  );
}

export function getStripePriceId(interval: StripeBillingInterval) {
  if (interval === "yearly") {
    return process.env.STRIPE_YEARLY_PRICE_ID?.trim() || null;
  }

  return process.env.STRIPE_MONTHLY_PRICE_ID?.trim()
    || process.env.STRIPE_PRICE_ID?.trim()
    || null;
}

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY_MISSING");
  }

  return new Stripe(secretKey, {
    apiVersion: "2026-06-24.dahlia",
    typescript: true,
  });
}
