// Expérience 1 : un nouveau test de la règle métier, sans base ni réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Alerte } from "../urbanhub-air/src/ports.ts";
import { DepotMesuresEnMemoire } from "../urbanhub-air/src/adaptateurs/depotMemoire.ts";
import { mesure } from "../urbanhub-air/src/domaine.ts";
import { SeuilMoyenneJournaliere } from "../urbanhub-air/src/regles.ts";
import { SurveillanceQualiteAir } from "../urbanhub-air/src/service.ts";

const pm10 = (valeur: number, jour: string) => mesure({ capteur: "capteur-12",
  polluant: "PM10", valeur, horodatage: `${jour}T08:00:00` });

test("les mesures de la veille ne comptent pas dans la moyenne du jour", async () => {
  const publiees: Alerte[] = [];
  const alertesEspionnes = { publier: async (a: Alerte) => { publiees.push(a); } };
  const service = new SurveillanceQualiteAir(new DepotMesuresEnMemoire(),
    alertesEspionnes, new SeuilMoyenneJournaliere("PM10", 50));
  await service.executer(pm10(90, "2026-11-16"));  // la veille : alerte pour le 16
  await service.executer(pm10(30, "2026-11-17"));  // le jour : moyenne 30, rien
  assert.deepEqual(publiees.map((a) => a.jour), ["2026-11-16"]);
});

test("une moyenne égale au seuil ne déclenche pas d'alerte", async () => {
  const publiees: Alerte[] = [];
  const alertesEspionnes = { publier: async (a: Alerte) => { publiees.push(a); } };
  const service = new SurveillanceQualiteAir(new DepotMesuresEnMemoire(),
    alertesEspionnes, new SeuilMoyenneJournaliere("PM10", 50));
  await service.executer(pm10(50, "2026-11-17"));  // 50 n'est pas au-dessus de 50
  assert.equal(publiees.length, 0);
});