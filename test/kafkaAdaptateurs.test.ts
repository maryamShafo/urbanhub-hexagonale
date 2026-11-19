// Les deux adaptateurs Kafka, testés sans Kafka (avec de faux objets).
import { test } from "node:test";
import assert from "node:assert/strict";
import type { AlerteBruit } from "../urbanhub-bruit/src/ports.ts";
import { alerteBruit } from "../urbanhub-bruit/src/domaine.ts";
import { PublicateurAlertesBruitKafka } from "../urbanhub-bruit/src/adaptateurs/publicationKafka.ts";
import { traiterMessage } from "../urbanhub-notifications/src/adaptateurs/entreeKafka.ts";
import { AlertesTraiteesEnMemoire } from "../urbanhub-notifications/src/adaptateurs/traiteesMemoire.ts";
import type { Notification } from "../urbanhub-notifications/src/ports.ts";
import { NotificationsBruit } from "../urbanhub-notifications/src/service.ts";

const alerte = alerteBruit({ capteur: "bruit-3", heure: "2026-11-18T23", moyenne: 70, seuil: 55 });

test("Kafka : l'alerte part dans le topic alertes-bruit, clé = le capteur, valeur = l'alerte en JSON", async () => {
  const envois: object[] = [];
  await new PublicateurAlertesBruitKafka({ async send(e: object) { envois.push(e); } }).publier(alerte);
  assert.deepEqual(envois, [{ topic: "alertes-bruit",
    messages: [{ key: "bruit-3", value: JSON.stringify(alerte) }] }]);
});

test("Kafka : un échec du producteur remonte (le réessai le traitera)", async () => {
  const producteur = { async send() { throw new Error("broker injoignable"); } };
  await assert.rejects(new PublicateurAlertesBruitKafka(producteur).publier({} as AlerteBruit),
    /broker injoignable/);
});

test("Kafka : le consommateur relit deux fois le même message, une seule notification", async () => {
  const prevenus: Notification[] = [];
  const traiter = traiterMessage(new NotificationsBruit(new AlertesTraiteesEnMemoire(),
    { prevenir: async (n: Notification) => { prevenus.push(n); } }), "test");
  const message = { partition: 1, message: { offset: "0", value: Buffer.from(JSON.stringify(alerte)) } };
  await traiter(message);
  await traiter(message);                       // le rejeu relit le même message
  assert.equal(prevenus.length, 1);
});