// Le patron Décorateur : le réessai enveloppe un publicateur, sans le modifier.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { AlerteBruit } from "../urbanhub-bruit/src/ports.ts";
import { CircuitOuvert } from "../urbanhub-bruit/src/adaptateurs/circuitOuvert.ts";
import { PublicateurBruitAvecReessai } from "../urbanhub-bruit/src/adaptateurs/reessai.ts";

// Un faux publicateur qui tombe en panne les premières fois
function publicateurQuiTombe(pannes: number) {
  const publicateur = {
    appels: 0,
    async publier() {
      publicateur.appels += 1;
      if (publicateur.appels <= pannes) throw new Error("fetch failed");
    },
  };
  return publicateur;
}

test("Décorateur : une panne passagère est absorbée (2 pannes, réussi au 3e essai)", async () => {
  const interne = publicateurQuiTombe(2);
  await new PublicateurBruitAvecReessai(interne, 3, 0).publier({} as AlerteBruit);
  assert.equal(interne.appels, 3);
});

test("Décorateur : une panne durable remonte au lieu d'être cachée", async () => {
  const publicateur = new PublicateurBruitAvecReessai(publicateurQuiTombe(5), 3, 0);
  await assert.rejects(publicateur.publier({} as AlerteBruit), /fetch failed/);
});

test("Décorateur : un circuit ouvert n'est pas retenté (un seul appel, aucune pause)", async () => {
  let appels = 0;
  const interne = { async publier() { appels += 1; throw new CircuitOuvert(); } };
  const debut = Date.now();
  await assert.rejects(new PublicateurBruitAvecReessai(interne, 3, 5000).publier({} as AlerteBruit),
    CircuitOuvert);
  assert.equal(appels, 1);
  assert.ok(Date.now() - debut < 1000, "le réessai a fait une pause");
});