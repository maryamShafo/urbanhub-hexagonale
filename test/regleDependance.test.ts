import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// La regle de dependance : le centre n'importe ni base, ni reseau, ni adaptateur.
const CENTRE = ["domaine.ts", "ports.ts", "regles.ts", "service.ts"];
const INTERDIT = /from\s+["'](node:(sqlite|http|net)|\.\/adaptateurs\/)|\bfetch\(/;

for (const fichier of CENTRE) {
  test(`${fichier} n'importe aucune technique`, () => {
    const source = readFileSync(
      new URL(`../urbanhub-air/src/${fichier}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, INTERDIT);
  });
}

test("la regle attrape la faute : un import de la base dans le centre", () => {
  assert.match('import { DatabaseSync } from "node:sqlite";', INTERDIT);
});
