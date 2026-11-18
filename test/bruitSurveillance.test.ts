// Le test du cas d'utilisation Bruit, avec des adaptateurs EN MÉMOIRE :
// ni base ni réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { AlerteBruit } from "../urbanhub-bruit/src/ports.ts";
import { DepotMesuresBruitEnMemoire } from "../urbanhub-bruit/src/adaptateurs/depotMemoire.ts";
import { mesureBruit } from "../urbanhub-bruit/src/domaine.ts";
import { SurveillanceBruit } from "../urbanhub-bruit/src/service.ts";

// Une mesure du capteur "bruit-3", à une date et une heure données
const bruit = (decibels: number, horodatage: string) =>
  mesureBruit({ capteur: "bruit-3", decibels, horodatage });

// Prépare un service neuf, avec un faux publicateur qui garde les alertes
function preparer() {
  const publiees: AlerteBruit[] = [];
  const alertesEspionnes = { publier: async (a: AlerteBruit) => { publiees.push(a); } };
  const service = new SurveillanceBruit(new DepotMesuresBruitEnMemoire(), alertesEspionnes);
  return { service, publiees };
}

test("le jour, une moyenne au-dessus de 65 dB publie une alerte", async () => {
  const { service, publiees } = preparer();
  await service.executer(bruit(60, "2026-11-18T14:00:00"));  // moyenne 60 : rien
  assert.equal(publiees.length, 0);
  await service.executer(bruit(80, "2026-11-18T14:30:00"));  // moyenne 70 : alerte
  assert.deepEqual(publiees.map((a) => [a.moyenne, a.seuil]), [[70, 65]]);
});

test("la nuit, le seuil descend à 55 dB : 60 dB suffit pour une alerte", async () => {
  const { service, publiees } = preparer();
  await service.executer(bruit(60, "2026-11-18T23:10:00"));  // nuit, 60 > 55
  assert.deepEqual(publiees.map((a) => [a.moyenne, a.seuil]), [[60, 55]]);
});

test("les mesures d'une autre heure ne comptent pas dans la moyenne", async () => {
  const { service, publiees } = preparer();
  await service.executer(bruit(90, "2026-11-18T13:50:00"));  // 13 h : alerte pour 13 h
  await service.executer(bruit(50, "2026-11-18T14:05:00"));  // 14 h : moyenne 50, rien
  assert.deepEqual(publiees.map((a) => a.heure), ["2026-11-18T13"]);
});