// Les deux microservices en vrai : Bruit publie en HTTP, Notifications reçoit.
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

test("de la mesure à la notification : Bruit publie en HTTP, Notifications reçoit", async () => {
  const prevenus: Notification[] = [];
  const notifications = await demarrer(entreeNotifications(new NotificationsBruit(
    new AlertesTraiteesEnMemoire(), { prevenir: async (n: Notification) => { prevenus.push(n); } })));
  const bruit = await demarrer(entreeBruit(new SurveillanceBruit(new DepotMesuresBruitEnMemoire(),
    new PublicateurAlertesBruitHttp(`${notifications.url}/alertes-bruit`), new SeuilJourNuit(65, 55))));
  try {
    const statut = await poster(`${bruit.url}/mesures-bruit`,
      { capteur: "bruit-3", decibels: 70, horodatage: "2026-11-18T23:00:00" });
    assert.equal(statut, 202);
    assert.deepEqual(prevenus.map((n) => n.identifiant), ["bruit-3:bruit:2026-11-18T23"]);
  } finally {
    bruit.serveur.close();
    notifications.serveur.close();
  }
});

test("Notifications refuse une alerte mal formée en 422", async () => {
  const notifications = await demarrer(entreeNotifications(new NotificationsBruit(
    new AlertesTraiteesEnMemoire(), { prevenir: async () => {} })));
  try {
    assert.equal(await poster(`${notifications.url}/alertes-bruit`, { capteur: "bruit-3" }), 422);
  } finally {
    notifications.serveur.close();
  }
});

test("le publicateur HTTP abandonne après son délai si Notifications ne répond pas", async () => {
  const lent = await demarrer(() => {});                   // un serveur qui ne répond jamais
  try {
    const debut = Date.now();
    await assert.rejects(new PublicateurAlertesBruitHttp(`${lent.url}/alertes-bruit`, 200)
      .publier({} as never));
    assert.ok(Date.now() - debut < 1000, "le délai n'a pas coupé l'appel");
  } finally {
    lent.serveur.closeAllConnections();
    lent.serveur.close();
  }
});