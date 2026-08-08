import assert from "node:assert/strict";
import test from "node:test";
import { validateAssistantStructuredResponse } from "./assistant-response";

test("accepte une réponse couverte qui cite uniquement les articles fournis", () => {
  const result = validateAssistantStructuredResponse({
    covered: true,
    answer: "Ouvre Plans puis ajoute l’exercice depuis ta séance.",
    citedArticleIds: ["programs"],
  }, new Set(["programs"]));

  assert.equal(result.ok, true);
});

test("rejette une citation qui n’a pas été fournie au modèle", () => {
  const result = validateAssistantStructuredResponse({
    covered: true,
    answer: "Réponse non fiable.",
    citedArticleIds: ["unknown"],
  }, new Set(["programs"]));

  assert.deepEqual(result, { ok: false, error: "invalid_citation" });
});

test("impose une réponse non couverte sans citation", () => {
  const result = validateAssistantStructuredResponse({
    covered: false,
    answer: "Je ne sais pas.",
    citedArticleIds: ["programs"],
  }, new Set(["programs"]));

  assert.deepEqual(result, { ok: false, error: "unexpected_citation" });
});
