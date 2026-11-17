import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DepotMesuresEnMemoire } from "../urbanhub-air/src/adaptateurs/depotMemoire.ts";
import { DepotMesuresSqlite } from "../urbanhub-air/src/adaptateurs/depotSqlite.ts";
import type { DepotMesures } from "../urbanhub-air/src/ports.ts";
import { mesure } from "../urbanhub-air/src/domaine.ts";

// Le meme contrat pour tous les adaptateurs du port DepotMesures.
const adaptateurs: Record<string, () => DepotMesures> = {
  memoire: () => new DepotMesuresEnMemoire(),
  sqlite: () => new DepotMesuresSqlite(join(mkdtempSync(join(tmpdir(), "air-")), "m.db")),
};
const pm10 = (capteur: string, jour: string) => mesure({ capteur, polluant: "PM10", valeur: 40,
  horodatage: `${jour}T08:00:00` });

for (const [nom, creer] of Object.entries(adaptateurs)) {
  test(`${nom} : les mesures du jour et du capteur, rien d'autre`, () => {
    const depot = creer();
    const matin = pm10("capteur-12", "2026-11-17");
    const veille = pm10("capteur-12", "2026-11-16");
    const voisin = pm10("capteur-07", "2026-11-17");
    [matin, veille, voisin].forEach((m) => depot.enregistrer(m));
    assert.deepEqual(depot.duJour("capteur-12", "PM10", "2026-11-17"), [matin]);
  });
}
