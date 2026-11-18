// Le test de CONTRAT du port DepotMesuresBruit :
// un seul test, que TOUT adaptateur du port doit réussir.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DepotMesuresBruitEnMemoire } from "../urbanhub-bruit/src/adaptateurs/depotMemoire.ts";
import { DepotMesuresBruitSqlite } from "../urbanhub-bruit/src/adaptateurs/depotSqlite.ts";
import type { DepotMesuresBruit } from "../urbanhub-bruit/src/ports.ts";
import { mesureBruit } from "../urbanhub-bruit/src/domaine.ts";

// La liste des adaptateurs à vérifier : la mémoire et SQLite
const adaptateurs: Record<string, () => DepotMesuresBruit> = {
  memoire: () => new DepotMesuresBruitEnMemoire(),
  sqlite: () => new DepotMesuresBruitSqlite(join(mkdtempSync(join(tmpdir(), "bruit-")), "b.db")),
};

const bruit = (capteur: string, horodatage: string) =>
  mesureBruit({ capteur, decibels: 60, horodatage });

// Le même test, lancé une fois pour chaque adaptateur
for (const [nom, creer] of Object.entries(adaptateurs)) {
  test(`Bruit ${nom} : les mesures du capteur et de l'heure, rien d'autre`, () => {
    const depot = creer();
    const aDixHeures = bruit("bruit-3", "2026-11-18T10:15:00");
    const aOnzeHeures = bruit("bruit-3", "2026-11-18T11:15:00");   // autre heure
    const voisin = bruit("bruit-7", "2026-11-18T10:20:00");        // autre capteur
    [aDixHeures, aOnzeHeures, voisin].forEach((m) => depot.enregistrer(m));
    assert.deepEqual(depot.deLHeure("bruit-3", "2026-11-18T10"), [aDixHeures]);
  });
}