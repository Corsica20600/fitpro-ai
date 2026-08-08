import type { AssistantStructuredResponse } from "./assistant-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : null;
}

export function validateAssistantStructuredResponse(
  value: unknown,
  allowedArticleIds: ReadonlySet<string>,
): { ok: true; value: AssistantStructuredResponse } | { ok: false; error: string } {
  if (!isRecord(value) || typeof value.covered !== "boolean") return { ok: false, error: "invalid_shape" };

  const answer = asText(value.answer);
  const citedArticleIds = Array.isArray(value.citedArticleIds) ? value.citedArticleIds.map(asText) : null;
  if (!answer || answer.length > 1200 || !citedArticleIds || citedArticleIds.some((id) => !id)) {
    return { ok: false, error: "invalid_content" };
  }
  if (new Set(citedArticleIds).size !== citedArticleIds.length || citedArticleIds.some((id) => !allowedArticleIds.has(id!))) {
    return { ok: false, error: "invalid_citation" };
  }
  if (value.covered && citedArticleIds.length === 0) return { ok: false, error: "missing_citation" };
  if (!value.covered && citedArticleIds.length > 0) return { ok: false, error: "unexpected_citation" };

  return { ok: true, value: { covered: value.covered, answer, citedArticleIds: citedArticleIds as string[] } };
}
