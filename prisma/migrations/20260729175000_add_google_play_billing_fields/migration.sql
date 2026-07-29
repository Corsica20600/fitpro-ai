-- AlterTable
ALTER TABLE "UserProfile"
  ADD COLUMN "googlePlayPurchaseTokenHash" TEXT,
  ADD COLUMN "googlePlayOrderId" TEXT,
  ADD COLUMN "googlePlayProductId" TEXT,
  ADD COLUMN "googlePlayBasePlanId" TEXT,
  ADD COLUMN "googlePlayPackageName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_googlePlayPurchaseTokenHash_key" ON "UserProfile"("googlePlayPurchaseTokenHash");
