import type { AssistantKnowledgeArticle } from "./assistant-types";

const STOP_WORDS = new Set([
  "a", "ai", "au", "aux", "avec", "ce", "ces", "comment", "de", "des", "du", "en", "est", "et", "il", "je", "la", "le", "les", "ma", "mes", "mon", "pour", "que", "sur", "tu", "un", "une", "vos", "votre",
]);

export function normalizeAssistantText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-FR");
}

export function normalizeRouteContext(value: string | null | undefined) {
  if (!value) return null;
  const route = value.trim().split("?")[0]?.split("#")[0] ?? "";
  if (!route.startsWith("/")) return null;
  const segment = route.split("/").filter(Boolean)[0];
  if (!segment || !["dashboard", "exercises", "programs", "progress", "history", "settings", "evolution", "workout", "watch"].includes(segment)) {
    return null;
  }
  return `/${segment}`;
}

export function getQuestionTerms(question: string) {
  return [...new Set(
    normalizeAssistantText(question)
      .split(/[^a-z0-9]+/)
      .filter((term) => term.length >= 3 && !STOP_WORDS.has(term)),
  )];
}

function countMatches(text: string, terms: string[]) {
  return terms.reduce((count, term) => count + (text.includes(term) ? 1 : 0), 0);
}

export function rankKnowledgeArticles(
  articles: AssistantKnowledgeArticle[],
  question: string,
  routeContext: string | null,
  limit = 5,
) {
  const terms = getQuestionTerms(question);
  const normalizedRoute = normalizeRouteContext(routeContext);

  return articles
    .map((article) => {
      const title = normalizeAssistantText(article.title);
      const content = normalizeAssistantText(article.content);
      const keywords = article.keywords.map(normalizeAssistantText);
      const titleMatches = countMatches(title, terms);
      const keywordMatches = countMatches(keywords.join(" "), terms);
      const contentMatches = countMatches(content, terms);
      const routeMatches = normalizedRoute !== null && article.routeContext === normalizedRoute;
      const score = titleMatches * 8 + keywordMatches * 6 + contentMatches * 2 + (routeMatches ? 5 : 0);

      return { article, score, matched: titleMatches + keywordMatches + contentMatches > 0 || routeMatches };
    })
    .filter((result) => result.matched && result.score >= 5)
    .sort((left, right) => right.score - left.score || left.article.title.localeCompare(right.article.title, "fr"))
    .slice(0, limit)
    .map((result) => result.article);
}
