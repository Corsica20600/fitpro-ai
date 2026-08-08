import { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import {
  ASSISTANT_DAILY_MESSAGE_LIMIT,
  ASSISTANT_FALLBACK_ANSWER,
  ASSISTANT_MAX_ARTICLES,
  ASSISTANT_MAX_QUESTION_LENGTH,
  type AssistantChatResult,
  type AssistantKnowledgeArticle,
} from "./assistant-types";
import { normalizeRouteContext, rankKnowledgeArticles } from "./knowledge-search";
import { validateAssistantStructuredResponse } from "./assistant-response";

type AssistantProfile = { id: string };
type OpenAiResponsePayload = {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
};

function getOpenAiResponseText(payload: OpenAiResponsePayload) {
  const direct = payload.output_text?.trim();
  if (direct) return direct;
  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .join("\n")
    .trim() ?? "";
}

function getUtcWindowStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function normalizeQuestion(value: unknown) {
  if (typeof value !== "string") return null;
  const question = value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  if (question.length < 2 || question.length > ASSISTANT_MAX_QUESTION_LENGTH) return null;
  return question;
}

export function isClearlyOutsideTraknioHelp(question: string) {
  return /\b(diagnostic|docteur|medecin|blessure|tendinite|fracture|traitement|ordonnance|nutrition|regime|calories? alimentaires?|macros?|proteines?|repas)\b/i.test(question.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
}

async function consumeAssistantMessage(profileId: string, attempts = 0): Promise<boolean> {
  const windowStart = getUtcWindowStart();
  const existing = await prisma.assistantUsageWindow.findUnique({
    where: { userProfileId_windowStart: { userProfileId: profileId, windowStart } },
    select: { requestCount: true },
  });

  if (!existing) {
    try {
      await prisma.assistantUsageWindow.create({ data: { userProfileId: profileId, windowStart, requestCount: 1 } });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempts < 1) {
        return consumeAssistantMessage(profileId, attempts + 1);
      }
      throw error;
    }
  }

  if (existing.requestCount >= ASSISTANT_DAILY_MESSAGE_LIMIT) return false;
  const updated = await prisma.assistantUsageWindow.updateMany({
    where: {
      userProfileId: profileId,
      windowStart,
      requestCount: { lt: ASSISTANT_DAILY_MESSAGE_LIMIT },
    },
    data: { requestCount: { increment: 1 } },
  });
  return updated.count === 1;
}

async function recordUnansweredQuestion(profileId: string, question: string, routeContext: string | null) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await prisma.assistantUnansweredQuestion.findFirst({
    where: { userProfileId: profileId, question, routeContext, resolved: false, createdAt: { gte: since } },
    select: { id: true },
  });
  if (!existing) {
    await prisma.assistantUnansweredQuestion.create({ data: { userProfileId: profileId, question, routeContext } });
  }
}

async function findRelevantArticles(question: string, routeContext: string | null) {
  const articles = await prisma.knowledgeArticle.findMany({
    where: { active: true },
    select: { id: true, title: true, category: true, content: true, keywords: true, routeContext: true },
    take: 80,
  }) as AssistantKnowledgeArticle[];
  return rankKnowledgeArticles(articles, question, routeContext, ASSISTANT_MAX_ARTICLES);
}

async function requestAssistantAnswer(question: string, routeContext: string | null, articles: AssistantKnowledgeArticle[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false as const, error: "assistant_unavailable" as const };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.TRAKNIO_ASSISTANT_MODEL?.trim() || "gpt-5-mini",
      input: [
        {
          role: "system",
          content: [{
            type: "input_text",
            text: [
              "Tu es l'assistant d'aide de Traknio.",
              "Reponds uniquement a propos de l'utilisation de Traknio a partir des articles fournis.",
              "N'invente aucune fonctionnalite, aucune etape et aucune information absente des articles.",
              "Ne reponds pas aux demandes medicales, nutritionnelles, sportives generales ou hors Traknio.",
              "Si les articles ne couvrent pas exactement la question, retourne covered=false, une reponse courte, et citedArticleIds vide.",
              "Si covered=true, cite uniquement les identifiants exacts des articles utilises.",
            ].join("\n"),
          }],
        },
        {
          role: "user",
          content: [{
            type: "input_text",
            text: JSON.stringify({
              question,
              routeContext,
              articles: articles.map((article) => ({
                id: article.id,
                title: article.title,
                category: article.category,
                routeContext: article.routeContext,
                content: article.content.slice(0, 1200),
              })),
            }),
          }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "traknio_assistant_answer",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              covered: { type: "boolean" },
              answer: { type: "string" },
              citedArticleIds: { type: "array", items: { type: "string" }, maxItems: ASSISTANT_MAX_ARTICLES },
            },
            required: ["covered", "answer", "citedArticleIds"],
          },
        },
      },
    }),
  }).catch(() => null);

  if (!response?.ok) return { ok: false as const, error: "assistant_unavailable" as const };
  const payload = await response.json().catch(() => null) as OpenAiResponsePayload | null;
  const raw = payload ? getOpenAiResponseText(payload) : "";
  try {
    const parsed = JSON.parse(raw);
    const valid = validateAssistantStructuredResponse(parsed, new Set(articles.map((article) => article.id)));
    if (!valid.ok) return { ok: false as const, error: "assistant_unavailable" as const };
    return { ok: true as const, response: valid.value };
  } catch {
    return { ok: false as const, error: "assistant_unavailable" as const };
  }
}

export async function askTraknioAssistant(
  profile: AssistantProfile,
  questionValue: unknown,
  routeContextValue: unknown,
): Promise<AssistantChatResult> {
  const question = normalizeQuestion(questionValue);
  if (!question) return { ok: false, error: "invalid_question" };
  const routeContext = normalizeRouteContext(typeof routeContextValue === "string" ? routeContextValue : null);

  const canAsk = await consumeAssistantMessage(profile.id).catch(() => false);
  if (!canAsk) return { ok: false, error: "rate_limited" };

  if (isClearlyOutsideTraknioHelp(question)) {
    await recordUnansweredQuestion(profile.id, question, routeContext).catch(() => undefined);
    return { ok: true, type: "fallback", answer: ASSISTANT_FALLBACK_ANSWER };
  }

  const articles = await findRelevantArticles(question, routeContext);
  if (articles.length === 0) {
    await recordUnansweredQuestion(profile.id, question, routeContext).catch(() => undefined);
    return { ok: true, type: "fallback", answer: ASSISTANT_FALLBACK_ANSWER };
  }

  const generated = await requestAssistantAnswer(question, routeContext, articles);
  if (!generated.ok) return generated;
  if (!generated.response.covered) {
    await recordUnansweredQuestion(profile.id, question, routeContext).catch(() => undefined);
    return { ok: true, type: "fallback", answer: ASSISTANT_FALLBACK_ANSWER };
  }

  return { ok: true, type: "answer", answer: generated.response.answer };
}
