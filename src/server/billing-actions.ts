"use server";

import { redirect } from "next/navigation";
import { absoluteUrl } from "@/src/lib/site-url";
import { getStripe, getStripePriceId, isStripeConfigured, type StripeBillingInterval } from "@/src/lib/stripe";
import { prisma } from "@/src/lib/prisma";
import { getAuthenticatedUserProfile } from "@/src/server/fitness-queries";

function getBillingInterval(formData: FormData): StripeBillingInterval {
  return formData.get("billingInterval") === "yearly" ? "yearly" : "monthly";
}

export async function createBillingCheckoutAction(formData: FormData) {
  if (!isStripeConfigured()) {
    redirect("/settings?billingError=config");
  }

  const billingInterval = getBillingInterval(formData);
  const profile = await getAuthenticatedUserProfile();
  const stripe = getStripe();
  const priceId = getStripePriceId(billingInterval);

  if (!priceId) {
    redirect(`/settings?billingError=${billingInterval === "yearly" ? "yearlyConfig" : "monthlyConfig"}`);
  }

  let customerId = profile.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email ?? undefined,
      name: profile.displayName,
      metadata: {
        userProfileId: profile.id,
      },
    });

    customerId = customer.id;
    await prisma.userProfile.update({
      where: { id: profile.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: absoluteUrl("/settings?billing=success"),
    cancel_url: absoluteUrl("/settings?billing=cancelled"),
    metadata: {
      userProfileId: profile.id,
      billingInterval,
    },
    subscription_data: {
      metadata: {
        userProfileId: profile.id,
        billingInterval,
      },
    },
  });

  if (!session.url) {
    redirect("/settings?billingError=checkout");
  }

  redirect(session.url);
}

export async function openBillingPortalAction() {
  if (!isStripeConfigured()) {
    redirect("/settings?billingError=config");
  }

  const profile = await getAuthenticatedUserProfile();

  if (!profile.stripeCustomerId) {
    redirect("/settings?billingError=noCustomer");
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripeCustomerId,
    return_url: absoluteUrl("/settings"),
  });

  redirect(session.url);
}
