import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Le code d'AVANT lit sa base et son URL au chargement : on les fixe d'abord.
test("avant l'hexagone : la regle ne se teste qu'avec une base sur disque et un faux service", async () => {
  const dossier = mkdtempSync(join(tmpdir(), "avant-"));       // 1 : une base sur disque
  const recus: { moyenne: number }[] = [];
  const faux = createServer((requete, reponse) => {            // 2 : un faux service Alertes
    let corps = "";
    requete.on("data", (morceau) => { corps += morceau; });
    requete.on("end", () => { recus.push(JSON.parse(corps)); reponse.writeHead(202).end(); });
  });
  await new Promise<void>((fini) => faux.listen(0, fini));           // 3 : un port libre
  process.env.BASE_MESURES = join(dossier, "mesures.db");      // 4
  process.env.URL_ALERTES = `http://localhost:${(faux.address() as AddressInfo).port}/alertes`; // 5
  const { enregistrerMesure } = await import("../urbanhub-air/avant/enregistrerMesure.ts"); // 6

  const mesure = (valeur: number, heure: string) => ({ capteur: "capteur-12", polluant: "PM10", valeur,
    horodatage: `2026-11-17T${heure}:00:00` });
  await enregistrerMesure(mesure(40, "08"));                   // moyenne 40 : rien
  assert.equal(recus.length, 0);
  await enregistrerMesure(mesure(70, "09"));                   // moyenne 55 : une alerte
  assert.deepEqual(recus.map((a) => a.moyenne), [55]);
  faux.close();
});
