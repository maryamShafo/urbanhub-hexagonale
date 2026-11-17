import { test } from "node:test";
import assert from "node:assert/strict";
import type { Alerte } from "../urbanhub-air/src/ports.ts";
import { alerte } from "../urbanhub-air/src/domaine.ts";
import { PublicateurAlertesKafka } from "../urbanhub-air/src/adaptateurs/publicationKafka.ts";

function fauxProducteur() {
  const envois: object[] = [];
  return { envois, async send(envoi: object) { envois.push(envoi); } };
}

test("l'alerte part dans le topic alertes, cle = le capteur, valeur = l'alerte en JSON", async () => {
  const producteur = fauxProducteur();
  const capteur12 = alerte({ capteur: "capteur-12", polluant: "PM10", jour: "2026-11-17", moyenne: 65, seuil: 50 });

  await new PublicateurAlertesKafka(producteur).publier(capteur12);

  assert.deepEqual(producteur.envois, [{
    topic: "alertes",
    messages: [{ key: "capteur-12", value: JSON.stringify(capteur12) }],
  }]);
});

test("un echec du producteur remonte : le reessai et la boite d'envoi le traitent", async () => {
  const producteur = { async send() { throw new Error("broker injoignable"); } };
  await assert.rejects(
    new PublicateurAlertesKafka(producteur).publier({} as Alerte),
    /broker injoignable/);
});
