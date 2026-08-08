export const ASSISTANT_FALLBACK_ANSWER = "Je n’ai pas encore cette information dans l’aide Traknio.";

export const ASSISTANT_MAX_QUESTION_LENGTH = 600;
export const ASSISTANT_DAILY_MESSAGE_LIMIT = 15;
export const ASSISTANT_MAX_ARTICLES = 5;

export type AssistantKnowledgeArticle = {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
  routeContext: string | null;
};

export type AssistantStructuredResponse = {
  covered: boolean;
  answer: string;
  citedArticleIds: string[];
};

export type AssistantChatResult =
  | { ok: true; type: "answer"; answer: string }
  | { ok: true; type: "fallback"; answer: typeof ASSISTANT_FALLBACK_ANSWER }
  | { ok: false; error: "assistant_unavailable" | "rate_limited" | "invalid_question" };
