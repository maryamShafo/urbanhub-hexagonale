// L'entrée HTTP du service Bruit : une mesure correcte est acceptée (202),
// une mesure mal formée est refusée (422).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { AlerteBruit } from "../urbanhub-bruit/src/ports.ts";
import { DepotMesuresBruitEnMemoire } from "../urbanhub-bruit/src/adaptateurs/depotMemoire.ts";
import { gestionnaire } from "../urbanhub-bruit/src/adaptateurs/entreeHttp.ts";
import { SeuilJourNuit } from "../urbanhub-bruit/src/regles.ts";
import { SurveillanceBruit } from "../urbanhub-bruit/src/service.ts";

test("Bruit HTTP : 202 pour une mesure correcte, 422 pour une mesure mal formée", async () => {
  const service = new SurveillanceBruit(new DepotMesuresBruitEnMemoire(),
    { publier: async (_a: AlerteBruit) => {} }, new SeuilJourNuit(65, 55));
  const serveur = createServer(gestionnaire(service));
  await new Promise<void>((fini) => serveur.listen(0, fini));
  const url = `http://localhost:${(serveur.address() as AddressInfo).port}/mesures-bruit`;
  const envoyer = (corps: string) => fetch(url, { method: "POST", body: corps });

  const bonne = await envoyer(JSON.stringify(
    { capteur: "bruit-3", decibels: 60, horodatage: "2026-11-18T14:00:00" }));
  const mauvaise = await envoyer(JSON.stringify({ capteur: "", decibels: -5 }));
  serveur.close();

  assert.equal(bonne.status, 202);
  assert.equal(mauvaise.status, 422);
});