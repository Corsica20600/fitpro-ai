import assert from "node:assert/strict";
import test from "node:test";

import { validateCoachStructuredResponse } from "./coach-response";

const dataKeys = new Set(["sessions.completed", "exercise.bench.loadDeltaKg"]);

function validResponse() {
  return {
    summary: "Tu as realise neuf seances sur la periode. Le developpe couche progresse regulierement.",
    positives: ["Neuf seances realisees."],
    watchouts: ["Le squat stagne sur trois expositions."],
    recommendations: [{
      title: "Conserver la progression actuelle",
      rationale: "Le developpe couche est en progression sur trois expositions.",
      dataUsed: ["exercise.bench.loadDeltaKg"],
    }],
    confidence: "HIGH",
  };
}

test("accepts a structured response grounded in available metrics", () => {
  const result = validateCoachStructuredResponse(validResponse(), dataKeys);

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.recommendations.length, 1);
});

test("rejects a recommendation without evidence or with a medical claim", () => {
  const withoutEvidence = validResponse();
  withoutEvidence.recommendations[0].dataUsed = ["recovery.calories"];
  assert.deepEqual(validateCoachStructuredResponse(withoutEvidence, dataKeys), { ok: false, error: "unsafe_recommendation" });

  const medicalClaim = validResponse();
  medicalClaim.recommendations[0].rationale = "Cette douleur confirme une tendinite.";
  assert.deepEqual(validateCoachStructuredResponse(medicalClaim, dataKeys), { ok: false, error: "unsafe_recommendation" });
});

test("rejects a numerical load increase and more than three recommendations", () => {
  const suddenIncrease = validResponse();
  suddenIncrease.recommendations[0].rationale = "Augmente de 10 kg a la prochaine seance.";
  assert.deepEqual(validateCoachStructuredResponse(suddenIncrease, dataKeys), { ok: false, error: "unsafe_recommendation" });

  const tooMany = validResponse();
  tooMany.recommendations = [...tooMany.recommendations, ...tooMany.recommendations, ...tooMany.recommendations, ...tooMany.recommendations];
  assert.deepEqual(validateCoachStructuredResponse(tooMany, dataKeys), { ok: false, error: "invalid_recommendations" });
});
