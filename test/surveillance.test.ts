import { test } from "node:test";
import assert from "node:assert/strict";
import type { Alerte } from "../urbanhub-air/src/ports.ts";
import { DepotMesuresEnMemoire } from "../urbanhub-air/src/adaptateurs/depotMemoire.ts";
import { mesure } from "../urbanhub-air/src/domaine.ts";
import { SeuilMoyenneJournaliere } from "../urbanhub-air/src/regles.ts";
import { SurveillanceQualiteAir } from "../urbanhub-air/src/service.ts";

const pm10 = (valeur: number, heure: string) => mesure({ capteur: "capteur-12",
  polluant: "PM10", valeur, horodatage: `2026-11-17T${heure}:00:00` });

test("la moyenne du jour au-dessus du seuil publie une alerte", async () => {
  const publiees: Alerte[] = [];  // adaptateur de test : il retient
  const alertesEspionnes = { publier: async (a: Alerte) => { publiees.push(a); } };
  const service = new SurveillanceQualiteAir(new DepotMesuresEnMemoire(),
    alertesEspionnes, new SeuilMoyenneJournaliere("PM10", 50));
  await service.executer(pm10(40, "08"));  // moyenne 40 : rien
  assert.equal(publiees.length, 0);
  await service.executer(pm10(70, "09"));  // moyenne 55 : une alerte
  assert.deepEqual(publiees.map((a) => a.moyenne), [55]);
});
