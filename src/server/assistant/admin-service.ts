import { prisma } from "@/src/lib/prisma";
import { parseAssistantArticleInput } from "./admin-validation";
import { ASSISTANT_ARTICLE_PROPOSALS } from "./admin-proposals";

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

export async function getAssistantAdminArticles(input?: {
  query?: string;
  category?: string;
  status?: "all" | "active" | "inactive";
  sort?: "updatedAt" | "title" | "category";
}) {
  const query = input?.query?.trim().slice(0, 120) ?? "";
  const status = input?.status ?? "all";
  const articles = await prisma.knowledgeArticle.findMany({
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
  });
  const categories = [...new Set(articles.map((article) => article.category))].sort((a, b) => a.localeCompare(b, "fr"));
  return { articles: articles.map(toArticleDto), categories, proposals: ASSISTANT_ARTICLE_PROPOSALS };
}

export async function createAssistantAdminArticle(value: unknown) {
  const parsed = parseAssistantArticleInput(value);
  if (!parsed.ok) return parsed;
  const { resolvedQuestionId, ...data } = parsed.value;
  const article = await prisma.$transaction(async (tx) => {
    const created = await tx.knowledgeArticle.create({ data, select: articleSelect });
    if (resolvedQuestionId) {
      await tx.assistantUnansweredQuestion.updateMany({ where: { id: resolvedQuestionId, resolved: false }, data: { resolved: true } });
    }
    return created;
  });
  return { ok: true as const, value: toArticleDto(article) };
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

export async function getAssistantUnansweredQuestions(status: "all" | "open" | "resolved" = "open") {
  const questions = await prisma.assistantUnansweredQuestion.findMany({
    where: status === "open" ? { resolved: false } : status === "resolved" ? { resolved: true } : {},
    select: { id: true, question: true, routeContext: true, createdAt: true, resolved: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return questions.map((question) => ({ ...question, createdAt: question.createdAt.toISOString() }));
}

export async function updateAssistantUnansweredQuestion(id: string, resolved: boolean) {
  const result = await prisma.assistantUnansweredQuestion.updateMany({ where: { id }, data: { resolved } });
  return result.count === 1;
}
