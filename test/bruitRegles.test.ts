// Le patron Stratégie : on change la règle SANS toucher au service.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { AlerteBruit } from "../urbanhub-bruit/src/ports.ts";
import { DepotMesuresBruitEnMemoire } from "../urbanhub-bruit/src/adaptateurs/depotMemoire.ts";
import { mesureBruit } from "../urbanhub-bruit/src/domaine.ts";
import { type RegleBruit, SeuilJourNuit, SeuilZoneSensible } from "../urbanhub-bruit/src/regles.ts";
import { SurveillanceBruit } from "../urbanhub-bruit/src/service.ts";

// Le même service, la même mesure de 60 dB à 14 h : seule la règle change
async function alertesAvec(regle: RegleBruit) {
  const publiees: AlerteBruit[] = [];
  const service = new SurveillanceBruit(new DepotMesuresBruitEnMemoire(),
    { publier: async (a: AlerteBruit) => { publiees.push(a); } }, regle);
  await service.executer(mesureBruit({ capteur: "bruit-3", decibels: 60,
    horodatage: "2026-11-18T14:00:00" }));
  return publiees;
}

test("Stratégie jour/nuit : 60 dB à 14 h ne dépasse pas 65 dB, aucune alerte", async () => {
  assert.equal((await alertesAvec(new SeuilJourNuit(65, 55))).length, 0);
});

test("Stratégie zone sensible : les mêmes 60 dB dépassent 50 dB, une alerte", async () => {
  const publiees = await alertesAvec(new SeuilZoneSensible(50));
  assert.deepEqual(publiees.map((a) => a.seuil), [50]);
});