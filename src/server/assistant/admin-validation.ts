import { normalizeRouteContext } from "./knowledge-search";

const MAX_TITLE_LENGTH = 160;
const MAX_CATEGORY_LENGTH = 80;
const MAX_CONTENT_LENGTH = 6_000;
const MAX_KEYWORDS = 20;
const MAX_KEYWORD_LENGTH = 80;

export type AssistantArticleInput = {
  title: string;
  category: string;
  content: string;
  keywords: string[];
  routeContext: string | null;
  active: boolean;
  resolvedQuestionId: string | null;
};

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();
  return cleaned.length > 0 && cleaned.length <= maxLength ? cleaned : null;
}

function cleanKeywords(value: unknown) {
  if (!Array.isArray(value)) return null;
  const keywords = [...new Set(value
    .map((keyword) => cleanText(keyword, MAX_KEYWORD_LENGTH))
    .filter((keyword): keyword is string => Boolean(keyword))
    .map((keyword) => keyword.toLocaleLowerCase("fr-FR")))]
    .slice(0, MAX_KEYWORDS);
  return keywords;
}

export function parseAssistantArticleInput(value: unknown): { ok: true; value: AssistantArticleInput } | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "invalid_payload" };
  const payload = value as Record<string, unknown>;
  const title = cleanText(payload.title, MAX_TITLE_LENGTH);
  const category = cleanText(payload.category, MAX_CATEGORY_LENGTH);
  const content = cleanText(payload.content, MAX_CONTENT_LENGTH);
  const keywords = cleanKeywords(payload.keywords);
  const rawRoute = typeof payload.routeContext === "string" ? payload.routeContext.trim() : "";
  const routeContext = rawRoute ? normalizeRouteContext(rawRoute) : null;

  if (!title || !category || !content || !keywords || typeof payload.active !== "boolean") {
    return { ok: false, error: "invalid_article" };
  }
  if (rawRoute && !routeContext) return { ok: false, error: "invalid_route_context" };

  const resolvedQuestionId = typeof payload.resolvedQuestionId === "string" && payload.resolvedQuestionId.trim()
    ? payload.resolvedQuestionId.trim()
    : null;
  return { ok: true, value: { title, category, content, keywords, routeContext, active: payload.active, resolvedQuestionId } };
}

export function parseResolvedInput(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const resolved = (value as Record<string, unknown>).resolved;
  return typeof resolved === "boolean" ? resolved : null;
}
