// La règle de dépendance du service Notifications : le centre n'importe aucune technique.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const CENTRE = ["domaine.ts", "ports.ts", "service.ts"];
const INTERDIT = /from\s+["'](node:(sqlite|http|net|fs)|\.\/adaptateurs\/)|\bfetch\(/;

for (const fichier of CENTRE) {
  test(`Notifications : ${fichier} n'importe aucune technique`, () => {
    const source = readFileSync(
      new URL(`../urbanhub-notifications/src/${fichier}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, INTERDIT);
  });
}