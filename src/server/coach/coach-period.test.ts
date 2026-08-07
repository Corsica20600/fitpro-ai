import assert from "node:assert/strict";
import test from "node:test";

import { getLastFourCompletedCalendarWeeks } from "./coach-period";

test("uses the four complete Paris calendar weeks before the current week", () => {
  const period = getLastFourCompletedCalendarWeeks(new Date("2026-08-07T12:00:00.000Z"));

  assert.equal(period.key, "2026-08-03");
  assert.equal(period.start.toISOString(), "2026-07-05T22:00:00.000Z");
  assert.equal(period.end.toISOString(), "2026-08-02T22:00:00.000Z");
  assert.equal(period.nextAvailableAt.toISOString(), "2026-08-09T22:00:00.000Z");
});

test("keeps Paris boundaries stable across the daylight-saving transition", () => {
  const period = getLastFourCompletedCalendarWeeks(new Date("2026-11-01T12:00:00.000Z"));

  assert.equal(period.key, "2026-10-26");
  assert.equal(period.start.toISOString(), "2026-09-27T22:00:00.000Z");
  assert.equal(period.end.toISOString(), "2026-10-25T23:00:00.000Z");
});
