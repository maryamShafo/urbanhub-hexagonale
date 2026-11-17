import { test } from "node:test";
import assert from "node:assert/strict";
import type { Alerte } from "../urbanhub-air/src/ports.ts";
import { CircuitOuvert } from "../urbanhub-air/src/adaptateurs/circuitOuvert.ts";
import { PublicateurAvecReessai } from "../urbanhub-air/src/adaptateurs/reessai.ts";

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

test("une panne passagere est absorbee", async () => {
  const interne = publicateurQuiTombe(2);
  await new PublicateurAvecReessai(interne, 3, 0).publier({} as Alerte);
  assert.equal(interne.appels, 3);
});

test("une panne durable remonte au lieu d'etre avalee", async () => {
  const publicateur = new PublicateurAvecReessai(publicateurQuiTombe(5), 3, 0);
  await assert.rejects(publicateur.publier({} as Alerte), /fetch failed/);
});

test("un circuit ouvert n'est pas retente : un seul appel, aucune pause", async () => {
  let appels = 0;
  const interne = { async publier() { appels += 1; throw new CircuitOuvert(); } };
  const debut = Date.now();
  await assert.rejects(new PublicateurAvecReessai(interne, 3, 5000).publier({} as Alerte), CircuitOuvert);
  assert.equal(appels, 1);
  assert.ok(Date.now() - debut < 1000, "le reessai a fait une pause");
});
