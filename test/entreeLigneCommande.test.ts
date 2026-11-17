import { test } from "node:test";
import assert from "node:assert/strict";
import type { Alerte } from "../urbanhub-air/src/ports.ts";
import { depuisArguments } from "../urbanhub-air/src/adaptateurs/entreeLigneCommande.ts";
import { DepotMesuresEnMemoire } from "../urbanhub-air/src/adaptateurs/depotMemoire.ts";
import { SeuilMoyenneJournaliere } from "../urbanhub-air/src/regles.ts";
import { SurveillanceQualiteAir } from "../urbanhub-air/src/service.ts";

test("la ligne de commande pilote le même cas d'utilisation : une alerte de moyenne 55", async () => {
  const publiees: Alerte[] = [];
  const alertesEspionnes = { publier: async (a: Alerte) => { publiees.push(a); } };
  const service = new SurveillanceQualiteAir(new DepotMesuresEnMemoire(),
    alertesEspionnes, new SeuilMoyenneJournaliere("PM10", 50));
  await depuisArguments(["capteur-12", "PM10", "40", "2026-11-17T08:00:00"], service);
  await depuisArguments(["capteur-12", "PM10", "70", "2026-11-17T09:00:00"], service);
  assert.deepEqual(publiees.map((a) => a.moyenne), [55]);
});