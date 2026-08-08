import { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import { parseAssistantArticleInput } from "./admin-validation";
import { ASSISTANT_ARTICLE_PROPOSALS, type AssistantArticleProposal } from "./admin-proposals";
import { findLegacyProposalProgress } from "./admin-proposal-progress";

const articleSelect = {
  id: true,
  title: true,
  category: true,
  content: true,
  keywords: true,
  routeContext: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toArticleDto(article: Awaited<ReturnType<typeof prisma.knowledgeArticle.findFirstOrThrow>>) {
  return { ...article, createdAt: article.createdAt.toISOString(), updatedAt: article.updatedAt.toISOString() };
}

export type AssistantAdminArticle = ReturnType<typeof toArticleDto>;
export type AssistantAdminProposal = AssistantArticleProposal & {
  status: "pending" | "processed";
  processedAt: string | null;
  articleId: string | null;
};

type AssistantUnansweredQuestionStatus = "all" | "open" | "resolved";

function toProposalDto(
  proposal: AssistantArticleProposal,
  progress: { status: "PROCESSED"; processedAt: Date; articleId: string | null } | undefined,
): AssistantAdminProposal {
  return {
    ...proposal,
    status: progress ? "processed" : "pending",
    processedAt: progress?.processedAt.toISOString() ?? null,
    articleId: progress?.articleId ?? null,
  };
}

export async function getAssistantAdminArticles(input?: {
  query?: string;
  category?: string;
  status?: "all" | "active" | "inactive";
  sort?: "updatedAt" | "title" | "category";
}) {
  const query = input?.query?.trim().slice(0, 120) ?? "";
  const status = input?.status ?? "all";
  const [articles, proposalProgress] = await Promise.all([
    prisma.knowledgeArticle.findMany({
    where: {
      ...(input?.category ? { category: input.category } : {}),
      ...(status === "active" ? { active: true } : status === "inactive" ? { active: false } : {}),
      ...(query ? { OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
        { keywords: { has: query.toLocaleLowerCase("fr-FR") } },
      ] } : {}),
    },
    select: articleSelect,
    orderBy: input?.sort === "title" ? { title: "asc" } : input?.sort === "category" ? [{ category: "asc" }, { title: "asc" }] : { updatedAt: "desc" },
    }),
    prisma.assistantArticleProposalProgress.findMany({
      select: { proposalId: true, status: true, processedAt: true, articleId: true },
    }),
  ]);
  const legacyProgress = findLegacyProposalProgress(ASSISTANT_ARTICLE_PROPOSALS, articles, proposalProgress);
  const resolvedProposalProgress = legacyProgress.length > 0
    ? await prisma.$transaction(async (tx) => {
      await tx.assistantArticleProposalProgress.createMany({
        data: legacyProgress,
        skipDuplicates: true,
      });
      return tx.assistantArticleProposalProgress.findMany({
        select: { proposalId: true, status: true, processedAt: true, articleId: true },
      });
    })
    : proposalProgress;
  const categories = [...new Set(articles.map((article) => article.category))].sort((a, b) => a.localeCompare(b, "fr"));
  const progressByProposalId = new Map(resolvedProposalProgress.map((progress) => [progress.proposalId, progress]));
  return {
    articles: articles.map(toArticleDto),
    categories,
    proposals: ASSISTANT_ARTICLE_PROPOSALS.map((proposal) => toProposalDto(proposal, progressByProposalId.get(proposal.id))),
  };
}

export async function createAssistantAdminArticle(value: unknown) {
  const parsed = parseAssistantArticleInput(value);
  if (!parsed.ok) return parsed;
  const { resolvedQuestionId, sourceProposalId, ...data } = parsed.value;
  if (sourceProposalId && !ASSISTANT_ARTICLE_PROPOSALS.some((proposal) => proposal.id === sourceProposalId)) {
    return { ok: false as const, error: "invalid_proposal" };
  }
  let result: { duplicateProposal: boolean; article: Awaited<ReturnType<typeof prisma.knowledgeArticle.create>> | null };
  try {
    result = await prisma.$transaction(async (tx) => {
      if (sourceProposalId) {
        const existing = await tx.assistantArticleProposalProgress.findUnique({ where: { proposalId: sourceProposalId }, select: { articleId: true } });
        if (existing) return { duplicateProposal: true as const, article: null };
      }
      const created = await tx.knowledgeArticle.create({ data, select: articleSelect });
      if (resolvedQuestionId) {
        await tx.assistantUnansweredQuestion.updateMany({ where: { id: resolvedQuestionId, resolved: false }, data: { resolved: true } });
      }
      if (sourceProposalId) {
        await tx.assistantArticleProposalProgress.create({ data: { proposalId: sourceProposalId, articleId: created.id } });
      }
      return { duplicateProposal: false as const, article: created };
    });
  } catch (error) {
    if (sourceProposalId && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false as const, error: "proposal_already_processed" };
    }
    throw error;
  }
  if (result.duplicateProposal || !result.article) return { ok: false as const, error: "proposal_already_processed" };
  return { ok: true as const, value: toArticleDto(result.article) };
}

export async function updateAssistantAdminArticle(id: string, value: unknown) {
  const parsed = parseAssistantArticleInput(value);
  if (!parsed.ok) return parsed;
  const data = {
    title: parsed.value.title,
    category: parsed.value.category,
    content: parsed.value.content,
    keywords: parsed.value.keywords,
    routeContext: parsed.value.routeContext,
    active: parsed.value.active,
  };
  const existing = await prisma.knowledgeArticle.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { ok: false as const, error: "not_found" };
  const article = await prisma.knowledgeArticle.update({ where: { id }, data, select: articleSelect });
  return { ok: true as const, value: toArticleDto(article) };
}

export async function getAssistantUnansweredQuestions(status: AssistantUnansweredQuestionStatus = "open") {
  const questions = await prisma.assistantUnansweredQuestion.findMany({
    where: status === "open" ? { resolved: false } : status === "resolved" ? { resolved: true } : {},
    select: { id: true, question: true, routeContext: true, createdAt: true, resolved: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return questions.map((question) => ({ ...question, createdAt: question.createdAt.toISOString() }));
}

export async function getAssistantUnansweredQuestionCounts() {
  const [open, resolved] = await Promise.all([
    prisma.assistantUnansweredQuestion.count({ where: { resolved: false } }),
    prisma.assistantUnansweredQuestion.count({ where: { resolved: true } }),
  ]);
  return { open, resolved, all: open + resolved };
}

export async function updateAssistantUnansweredQuestion(id: string, resolved: boolean) {
  const result = await prisma.assistantUnansweredQuestion.updateMany({ where: { id }, data: { resolved } });
  return result.count === 1;
}
