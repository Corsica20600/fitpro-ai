import type Stripe from "stripe";
import type { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";

function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  if (status === "trialing") return "TRIALING";
  if (status === "active") return "ACTIVE";
  if (status === "past_due") return "PAST_DUE";
  if (status === "canceled") return "CANCELED";
  if (status === "incomplete") return "INCOMPLETE";
  if (status === "incomplete_expired") return "INCOMPLETE_EXPIRED";
  if (status === "unpaid") return "UNPAID";
  if (status === "paused") return "PAUSED";
  return "FREE";
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const subscriptionWithLegacyPeriod = subscription as Stripe.Subscription & {
    current_period_end?: number;
  };
  const periodEnd =
    subscriptionWithLegacyPeriod.current_period_end
    ?? subscription.items.data[0]?.current_period_end
    ?? null;

  return periodEnd ? new Date(periodEnd * 1000) : null;
}

function getPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price?.id ?? null;
}

function getCustomerId(subscription: Stripe.Subscription) {
  return typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
}

export async function syncStripeSubscription(subscription: Stripe.Subscription) {
  const userProfileId = subscription.metadata.userProfileId;
  const customerId = getCustomerId(subscription);
  const where = userProfileId ? { id: userProfileId } : { stripeCustomerId: customerId };

  await prisma.userProfile.updateMany({
    where,
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: mapStripeSubscriptionStatus(subscription.status),
      subscriptionPriceId: getPriceId(subscription),
      subscriptionCurrentPeriodEnd: getCurrentPeriodEnd(subscription),
      subscriptionCancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

export async function clearStripeSubscription(subscription: Stripe.Subscription) {
  const customerId = getCustomerId(subscription);

  await prisma.userProfile.updateMany({
    where: {
      OR: [
        { stripeSubscriptionId: subscription.id },
        { stripeCustomerId: customerId },
      ],
    },
    data: {
      stripeSubscriptionId: null,
      subscriptionStatus: "CANCELED",
      subscriptionPriceId: null,
      subscriptionCurrentPeriodEnd: getCurrentPeriodEnd(subscription),
      subscriptionCancelAtPeriodEnd: false,
    },
  });
}
