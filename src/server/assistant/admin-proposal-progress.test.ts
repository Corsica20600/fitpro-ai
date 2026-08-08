import assert from "node:assert/strict";
import test from "node:test";
import { findLegacyProposalProgress } from "./admin-proposal-progress";

const proposal = {
  id: "exercises-custom",
  title: "Créer un exercice personnalisé",
  category: "EXERCICES",
  routeContext: "/exercises",
  keywords: ["créer", "exercice"],
  content: "Contenu de base.",
};

test("associe un article historique uniquement à la proposition strictement correspondante", () => {
  const result = findLegacyProposalProgress([proposal], [{
    id: "article-1",
    title: "Créer un exercice personnalisé",
    category: "EXERCICES",
    routeContext: "/exercises",
  }], []);

  assert.deepEqual(result, [{ proposalId: "exercises-custom", articleId: "article-1" }]);
});

test("ne rapproche pas un article historique dont la route ou le titre diffère", () => {
  const result = findLegacyProposalProgress([proposal], [{
    id: "article-1",
    title: "Modifier un exercice personnalisé",
    category: "EXERCICES",
    routeContext: "/exercises",
  }, {
    id: "article-2",
    title: "Créer un exercice personnalisé",
    category: "EXERCICES",
    routeContext: "/programs",
  }], []);

  assert.deepEqual(result, []);
});

test("ne recrée pas un suivi déjà persistant", () => {
  const result = findLegacyProposalProgress([proposal], [{
    id: "article-1",
    title: "Créer un exercice personnalisé",
    category: "EXERCICES",
    routeContext: "/exercises",
  }], [{ proposalId: "exercises-custom", articleId: "article-1" }]);

  assert.deepEqual(result, []);
});
