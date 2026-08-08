import assert from "node:assert/strict";
import test from "node:test";
import { calculateBodyFatPercentage } from "@/src/lib/body-measurements";

test("calculateBodyFatPercentage calculates fat mass from kilograms", () => {
  assert.equal(calculateBodyFatPercentage(81, 16.4), 20.25);
});

test("calculateBodyFatPercentage rejects incomplete or invalid measurements", () => {
  assert.equal(calculateBodyFatPercentage(null, 16.4), null);
  assert.equal(calculateBodyFatPercentage(81, null), null);
  assert.equal(calculateBodyFatPercentage(0, 16.4), null);
  assert.equal(calculateBodyFatPercentage(81, -1), null);
});
