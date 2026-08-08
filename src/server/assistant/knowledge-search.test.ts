import assert from "node:assert/strict";
import test from "node:test";
import type { AssistantKnowledgeArticle } from "./assistant-types";
import { normalizeRouteContext, rankKnowledgeArticles } from "./knowledge-search";
import { isClearlyOutsideTraknioHelp } from "./assistant-service";

const articles: AssistantKnowledgeArticle[] = [
  {
    id: "programs",
    title: "Créer et modifier un programme",
    category: "PROGRAMMES",
    content: "Dans Plans, crée un programme puis ajoute les exercices de tes séances.",
    keywords: ["programme", "plans", "ajouter exercice"],
    routeContext: "/programs",
  },
  {
    id: "timer",
    title: "Utiliser le chrono de repos",
    category: "SEANCES",
    content: "Les boutons plus 15 et moins 15 ajustent le repos.",
    keywords: ["chrono", "repos", "15 secondes"],
    routeContext: "/workout",
  },
];

test("normalise uniquement les contextes de route pris en charge", () => {
  assert.equal(normalizeRouteContext("/programs/day/1?tab=edit"), "/programs");
  assert.equal(normalizeRouteContext("https://example.test/workout"), null);
  assert.equal(normalizeRouteContext("/unknown"), null);
});

test("classe un article de la route courante avant les autres correspondances", () => {
  const results = rankKnowledgeArticles(articles, "Comment ajouter un exercice à mon programme ?", "/programs");
  assert.equal(results[0]?.id, "programs");
});

test("ne retourne aucun article quand la question ne correspond à aucune aide", () => {
  const results = rankKnowledgeArticles(articles, "Quel repas dois-je préparer ce soir ?", "/dashboard");
  assert.deepEqual(results, []);
});

test("bloque les questions médicales et nutritionnelles avant tout appel IA", () => {
  assert.equal(isClearlyOutsideTraknioHelp("Quel régime et quelles protéines dois-je manger ?"), true);
  assert.equal(isClearlyOutsideTraknioHelp("Comment modifier mon programme ?"), false);
});
