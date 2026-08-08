import assert from "node:assert/strict";
import test from "node:test";
import { isTraknioAdminEmail, parseTraknioAdminEmails } from "./admin-access";

test("lit une liste d’administrateurs sans tenir compte de la casse", () => {
  const admins = parseTraknioAdminEmails("Owner@Traknio.com, test@traknio.com\nadmin@traknio.com");
  assert.equal(admins.size, 3);
  assert.equal(isTraknioAdminEmail("OWNER@traknio.com", admins), true);
  assert.equal(isTraknioAdminEmail("visitor@traknio.com", admins), false);
});

test("refuse tout accès quand la liste d’administrateurs est vide", () => {
  assert.equal(isTraknioAdminEmail("owner@traknio.com", parseTraknioAdminEmails("")), false);
});
