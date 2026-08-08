import assert from "node:assert/strict";
import test from "node:test";
import { parseAssistantArticleInput, parseResolvedInput } from "./admin-validation";

test("valide un article d’aide avec des mots-clés simples et une route connue", () => {
  const result = parseAssistantArticleInput({
    title: "Créer un exercice",
    category: "EXERCICES",
    content: "Ouvre Mes exercices puis ajoute un exercice.",
    keywords: ["Créer", "exercice", "Créer"],
    routeContext: "/exercises/custom",
    active: true,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.value.keywords, ["créer", "exercice"]);
    assert.equal(result.value.routeContext, "/exercises");
  }
});

test("refuse une route qui ne peut pas être utilisée par la recherche de l’assistant", () => {
  const result = parseAssistantArticleInput({ title: "A", category: "A", content: "Réponse", keywords: [], routeContext: "/admin", active: true });
  assert.deepEqual(result, { ok: false, error: "invalid_route_context" });
});

test("valide uniquement un booléen pour le statut traité d’une question", () => {
  assert.equal(parseResolvedInput({ resolved: true }), true);
  assert.equal(parseResolvedInput({ resolved: "true" }), null);
});

test("conserve l’identifiant d’une proposition source lors de la création d’un article", () => {
  const result = parseAssistantArticleInput({
    title: "Créer un exercice",
    category: "EXERCICES",
    content: "Ouvre Mes exercices puis ajoute un exercice.",
    keywords: ["créer", "exercice"],
    routeContext: "/exercises",
    active: true,
    sourceProposalId: "exercises-custom",
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.sourceProposalId, "exercises-custom");
});
