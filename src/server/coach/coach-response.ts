import type { CoachStructuredResponse } from "./coach-types";

const DIAGNOSTIC_LANGUAGE = /\b(diagnostic|diagnostiquer|pathologie|fracture|tendinite|lesion|prescri[sp]|guerir)\b/i;
const NUMERIC_LOAD_INCREASE = /\b(augmente[rz]?|ajoute[rz]?|passe[rz]? a)\b[^.!?]{0,40}\b\d+(?:[.,]\d+)?\s*(kg|%)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : null;
}

function sentences(value: string) {
  return value.split(/[.!?]+/).map((sentence) => sentence.trim()).filter(Boolean);
}

function containsUnsafeClaim(value: string) {
  return DIAGNOSTIC_LANGUAGE.test(value) || NUMERIC_LOAD_INCREASE.test(value);
}

export function validateCoachStructuredResponse(
  value: unknown,
  availableDataKeys: ReadonlySet<string>,
): { ok: true; value: CoachStructuredResponse } | { ok: false; error: string } {
  if (!isRecord(value)) return { ok: false, error: "response_not_object" };

  const summary = asTrimmedString(value.summary);
  if (!summary || sentences(summary).length < 2 || sentences(summary).length > 4 || containsUnsafeClaim(summary)) {
    return { ok: false, error: "invalid_summary" };
  }

  const positives = Array.isArray(value.positives) ? value.positives.map(asTrimmedString) : null;
  const watchouts = Array.isArray(value.watchouts) ? value.watchouts.map(asTrimmedString) : null;
  if (!positives || !watchouts || positives.some((item) => !item) || watchouts.some((item) => !item)) {
    return { ok: false, error: "invalid_points" };
  }
  if ([...positives, ...watchouts].some((item) => containsUnsafeClaim(item!))) {
    return { ok: false, error: "unsafe_points" };
  }

  if (!Array.isArray(value.recommendations) || value.recommendations.length > 3) {
    return { ok: false, error: "invalid_recommendations" };
  }
  const recommendations: CoachStructuredResponse["recommendations"] = [];
  for (const recommendation of value.recommendations) {
    if (!isRecord(recommendation)) return { ok: false, error: "invalid_recommendation" };
    const title = asTrimmedString(recommendation.title);
    const rationale = asTrimmedString(recommendation.rationale);
    const dataUsed = Array.isArray(recommendation.dataUsed)
      ? recommendation.dataUsed.map(asTrimmedString)
      : null;
    if (!title || !rationale || !dataUsed || dataUsed.length === 0 || dataUsed.some((item) => !item)) {
      return { ok: false, error: "invalid_recommendation" };
    }
    if (containsUnsafeClaim(`${title} ${rationale}`) || dataUsed.some((key) => !availableDataKeys.has(key!))) {
      return { ok: false, error: "unsafe_recommendation" };
    }
    recommendations.push({ title, rationale, dataUsed: dataUsed as string[] });
  }

  if (value.confidence !== "LOW" && value.confidence !== "MEDIUM" && value.confidence !== "HIGH") {
    return { ok: false, error: "invalid_confidence" };
  }

  return {
    ok: true,
    value: { summary, positives: positives as string[], watchouts: watchouts as string[], recommendations, confidence: value.confidence },
  };
}
