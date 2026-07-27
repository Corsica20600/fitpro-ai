CREATE TYPE "SubscriptionStatus" AS ENUM (
  'FREE',
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED',
  'UNPAID',
  'PAUSED'
);

ALTER TABLE "UserProfile"
  ADD COLUMN "stripeCustomerId" TEXT,
  ADD COLUMN "stripeSubscriptionId" TEXT,
  ADD COLUMN "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "subscriptionPriceId" TEXT,
  ADD COLUMN "subscriptionCurrentPeriodEnd" TIMESTAMP(3),
  ADD COLUMN "subscriptionCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "UserProfile_stripeCustomerId_key" ON "UserProfile"("stripeCustomerId");
CREATE UNIQUE INDEX "UserProfile_stripeSubscriptionId_key" ON "UserProfile"("stripeSubscriptionId");
CREATE INDEX "UserProfile_subscriptionStatus_idx" ON "UserProfile"("subscriptionStatus");
