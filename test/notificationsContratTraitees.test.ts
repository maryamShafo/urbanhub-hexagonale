// Le test de CONTRAT du port AlertesTraitees : la mémoire et le fichier font pareil.
// En plus, le fichier se souvient après un redémarrage (nouvel objet, même fichier).
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AlertesTraiteesFichier } from "../urbanhub-notifications/src/adaptateurs/traiteesFichier.ts";
import { AlertesTraiteesEnMemoire } from "../urbanhub-notifications/src/adaptateurs/traiteesMemoire.ts";
import type { AlertesTraitees } from "../urbanhub-notifications/src/ports.ts";

const adaptateurs: Record<string, () => AlertesTraitees> = {
  memoire: () => new AlertesTraiteesEnMemoire(),
  fichier: () => new AlertesTraiteesFichier(join(mkdtempSync(join(tmpdir(), "notif-")), "t.json")),
};

for (const [nom, creer] of Object.entries(adaptateurs)) {
  test(`AlertesTraitees ${nom} : se souvient de ce qu'on ajoute, et de rien d'autre`, () => {
    const traitees = creer();
    traitees.ajouter("bruit-3:bruit:2026-11-18T23");
    assert.equal(traitees.contient("bruit-3:bruit:2026-11-18T23"), true);
    assert.equal(traitees.contient("bruit-7:bruit:2026-11-18T23"), false);
  });
}

test("AlertesTraitees fichier : la liste survit au redémarrage du service", () => {
  const chemin = join(mkdtempSync(join(tmpdir(), "notif-")), "t.json");
  new AlertesTraiteesFichier(chemin).ajouter("bruit-3:bruit:2026-11-18T23");
  const apresRedemarrage = new AlertesTraiteesFichier(chemin);
  assert.equal(apresRedemarrage.contient("bruit-3:bruit:2026-11-18T23"), true);
});