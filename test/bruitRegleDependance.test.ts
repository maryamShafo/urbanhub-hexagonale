// La règle de dépendance du service Bruit :
// le centre (domaine, ports, cas d'utilisation) n'importe AUCUNE technique.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const CENTRE = ["domaine.ts", "ports.ts", "service.ts"];
// Interdit : la base (node:sqlite), le réseau (node:http, node:net, fetch),
// les fichiers (node:fs) et les adaptateurs.
const INTERDIT = /from\s+["'](node:(sqlite|http|net|fs)|\.\/adaptateurs\/)|\bfetch\(/;

for (const fichier of CENTRE) {
  test(`Bruit : ${fichier} n'importe aucune technique`, () => {
    const source = readFileSync(
      new URL(`../urbanhub-bruit/src/${fichier}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, INTERDIT);
  });
}

test("Bruit : la règle attrape la faute, un import de la base dans le centre", () => {
  assert.match('import { DatabaseSync } from "node:sqlite";', INTERDIT);
});