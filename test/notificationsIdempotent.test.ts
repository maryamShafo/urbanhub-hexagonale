// Le consommateur IDEMPOTENT : un message reçu deux fois n'agit qu'une fois.
// L'identifiant est tiré de la mesure : capteur + « bruit » + heure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type RequestListener } from "node:http";
import type { AddressInfo } from "node:net";
import { DepotMesuresBruitEnMemoire } from "../urbanhub-bruit/src/adaptateurs/depotMemoire.ts";
import { gestionnaire as entreeBruit } from "../urbanhub-bruit/src/adaptateurs/entreeHttp.ts";
import { PublicateurAlertesBruitHttp } from "../urbanhub-bruit/src/adaptateurs/publicationHttp.ts";
import { SeuilJourNuit } from "../urbanhub-bruit/src/regles.ts";
import { SurveillanceBruit } from "../urbanhub-bruit/src/service.ts";
import { gestionnaire as entreeNotifications } from "../urbanhub-notifications/src/adaptateurs/entreeHttp.ts";
import { AlertesTraiteesEnMemoire } from "../urbanhub-notifications/src/adaptateurs/traiteesMemoire.ts";
import type { Notification } from "../urbanhub-notifications/src/ports.ts";
import { NotificationsBruit } from "../urbanhub-notifications/src/service.ts";

async function demarrer(gestionnaire: RequestListener) {
  const serveur = createServer(gestionnaire);
  await new Promise<void>((pret) => serveur.listen(0, "127.0.0.1", pret));
  return { serveur, url: `http://127.0.0.1:${(serveur.address() as AddressInfo).port}` };
}

const poster = async (url: string, corps: object) => (await fetch(url, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify(corps) })).status;

function notifications() {
  const prevenus: Notification[] = [];
  const service = new NotificationsBruit(new AlertesTraiteesEnMemoire(),
    { prevenir: async (n: Notification) => { prevenus.push(n); } });
  return { service, prevenus };
}

const alerte = { identifiant: "bruit-3:bruit:2026-11-18T23", capteur: "bruit-3",
  heure: "2026-11-18T23", moyenne: 70, seuil: 55 };

test("idempotence : le même message envoyé deux fois en HTTP ne notifie qu'une fois", async () => {
  const { service, prevenus } = notifications();
  const n = await demarrer(entreeNotifications(service));
  try {
    const statuts = [await poster(`${n.url}/alertes-bruit`, alerte),
                     await poster(`${n.url}/alertes-bruit`, alerte)];  // le même message, deux fois
    assert.deepEqual(statuts, [202, 202]);       // les deux sont acceptés...
    assert.equal(prevenus.length, 1);            // ...mais un seul effet
  } finally {
    n.serveur.close();
  }
});

test("idempotence : deux alertes d'autres heures ou d'autres capteurs notifient chacune", async () => {
  const { service, prevenus } = notifications();
  await service.recevoir({ ...alerte });
  await service.recevoir({ ...alerte, identifiant: "bruit-3:bruit:2026-11-19T00", heure: "2026-11-19T00" });
  await service.recevoir({ ...alerte, identifiant: "bruit-7:bruit:2026-11-18T23", capteur: "bruit-7" });
  assert.equal(prevenus.length, 3);
});

test("de bout en bout : deux mesures trop fortes dans la même heure ne notifient qu'une fois", async () => {
  const { service, prevenus } = notifications();
  const n = await demarrer(entreeNotifications(service));
  const bruit = await demarrer(entreeBruit(new SurveillanceBruit(new DepotMesuresBruitEnMemoire(),
    new PublicateurAlertesBruitHttp(`${n.url}/alertes-bruit`), new SeuilJourNuit(65, 55))));
  try {
    for (const minute of ["10", "40"]) {          // 23 h 10 puis 23 h 40 : même heure, même identifiant
      await poster(`${bruit.url}/mesures-bruit`,
        { capteur: "bruit-3", decibels: 70, horodatage: `2026-11-18T23:${minute}:00` });
    }
    assert.deepEqual(prevenus.map((p) => p.identifiant), ["bruit-3:bruit:2026-11-18T23"]);
  } finally {
    bruit.serveur.close();
    n.serveur.close();
  }
});