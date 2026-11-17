// Les deux microservices en vrai : HTTP, SQLite, et la publication de l'un vers l'autre.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { createServer, type RequestListener } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DepotMesuresSqlite } from "../urbanhub-air/src/adaptateurs/depotSqlite.ts";
import { gestionnaire as entreeAir } from "../urbanhub-air/src/adaptateurs/entreeHttp.ts";
import { PublicateurAlertesHttp } from "../urbanhub-air/src/adaptateurs/publicationHttp.ts";
import { PublicateurAvecReessai } from "../urbanhub-air/src/adaptateurs/reessai.ts";
import { SeuilMoyenneJournaliere } from "../urbanhub-air/src/regles.ts";
import { SurveillanceQualiteAir } from "../urbanhub-air/src/service.ts";
import { gestionnaire as entreeAlertes } from "../urbanhub-alertes/src/entreeHttp.ts";
import { ReceptionAlertes } from "../urbanhub-alertes/src/service.ts";

async function demarrer(gestionnaire: RequestListener) {
  const serveur = createServer(gestionnaire);
  await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
  return { serveur, url: `http://127.0.0.1:${(serveur.address() as AddressInfo).port}` };
}

const poster = async (url: string, corps: object) => (await fetch(url, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify(corps) })).status;

const base = () => new DepotMesuresSqlite(join(mkdtempSync(join(tmpdir(), "air-")), "m.db"));
const regle = new SeuilMoyenneJournaliere("PM10", 50);

test("deux mesures au-dessus du seuil previennent une seule fois", async () => {
  const prevenus: string[] = [];
  const alertes = await demarrer(entreeAlertes(new ReceptionAlertes(
    { prevenir: (a) => prevenus.push(a.identifiant) }), () => {}));
  const service = new SurveillanceQualiteAir(base(), new PublicateurAvecReessai(
    new PublicateurAlertesHttp(`${alertes.url}/alertes`)), regle);
  const air = await demarrer(entreeAir(service));
  try {
    const statuts: number[] = [];
    for (const [heure, valeur] of [["08", 60], ["09", 70]]) {
      statuts.push(await poster(`${air.url}/mesures`, { capteur: "capteur-12",
        polluant: "PM10", valeur, horodatage: `2026-11-17T${heure}:00:00` }));
    }
    assert.deepEqual(statuts, [202, 202]);
    assert.deepEqual(prevenus, ["capteur-12:PM10:2026-11-17"]);
  } finally {
    air.serveur.close();
    alertes.serveur.close();
  }
});

test("une mesure mal formee est refusee en 422", async () => {
  const air = await demarrer(entreeAir(new SurveillanceQualiteAir(base(), null as never, regle)));
  try {
    assert.equal(await poster(`${air.url}/mesures`, { capteur: "capteur-12" }), 422);
  } finally {
    air.serveur.close();
  }
});
