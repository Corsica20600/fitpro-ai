CREATE TYPE "AssistantProposalStatus" AS ENUM ('PROCESSED');

CREATE TABLE "AssistantArticleProposalProgress" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "status" "AssistantProposalStatus" NOT NULL DEFAULT 'PROCESSED',
    "articleId" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssistantArticleProposalProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssistantArticleProposalProgress_proposalId_key" ON "AssistantArticleProposalProgress"("proposalId");
CREATE UNIQUE INDEX "AssistantArticleProposalProgress_articleId_key" ON "AssistantArticleProposalProgress"("articleId");
CREATE INDEX "AssistantArticleProposalProgress_status_processedAt_idx" ON "AssistantArticleProposalProgress"("status", "processedAt");
