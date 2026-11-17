import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { importerCsv } from "../urbanhub-air/src/adaptateurs/entreeCsv.ts";
import { DepotMesuresEnMemoire } from "../urbanhub-air/src/adaptateurs/depotMemoire.ts";
import type { Alerte } from "../urbanhub-air/src/ports.ts";
import { SeuilMoyenneJournaliere } from "../urbanhub-air/src/regles.ts";
import { SurveillanceQualiteAir } from "../urbanhub-air/src/service.ts";

const LIGNES = ["capteur,polluant,valeur,horodatage",
  "capteur-12,PM10,40,2026-11-17T08:00:00",
  "capteur-12,PM10,70,2026-11-17T09:00:00"];

function importerAvec(finDeLigne: string) {
  const chemin = join(mkdtempSync(join(tmpdir(), "csv-")), "capteur-12.csv");
  writeFileSync(chemin, LIGNES.join(finDeLigne) + finDeLigne);
  const publiees: Alerte[] = [];
  const alertesEspionnes = { publier: async (a: Alerte) => { publiees.push(a); } };
  const service = new SurveillanceQualiteAir(new DepotMesuresEnMemoire(),
    alertesEspionnes, new SeuilMoyenneJournaliere("PM10", 50));
  return importerCsv(chemin, service).then(() => publiees);
}

test("un fichier CSV pilote le meme cas d'utilisation : une alerte de moyenne 55", async () => {
  const publiees = await importerAvec("\n");
  assert.deepEqual(publiees.map((a) => a.moyenne), [55]);
});

test("un fichier aux fins de ligne Windows donne la meme alerte, sans \r dans l'horodatage", async () => {
  const publiees = await importerAvec("\r\n");
  assert.deepEqual(publiees.map((a) => a.moyenne), [55]);
  assert.equal(publiees[0].jour, "2026-11-17");
});
