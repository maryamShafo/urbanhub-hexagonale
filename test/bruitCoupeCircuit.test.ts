// Le coupe-circuit : 5 échecs l'ouvrent, 30 s de refus immédiat, puis un appel d'essai.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { AlerteBruit } from "../urbanhub-bruit/src/ports.ts";
import { CircuitOuvert } from "../urbanhub-bruit/src/adaptateurs/circuitOuvert.ts";
import { PublicateurBruitAvecCoupeCircuit } from "../urbanhub-bruit/src/adaptateurs/coupeCircuit.ts";

const alerte = {} as AlerteBruit;

// Un faux publicateur qu'on peut mettre en panne ou réparer, et qui compte ses appels
function publicateur() {
  const p = { appels: 0, enPanne: true,
    async publier() { p.appels += 1; if (p.enPanne) throw new Error("fetch failed"); } };
  return p;
}

// Une fausse horloge : le test avance le temps sans attendre 30 vraies secondes
function horloge() {
  const h = { t: 0, maintenant: () => h.t };
  return h;
}

test("Coupe-circuit : après 5 échecs, il s'ouvre et refuse sans appeler le réseau", async () => {
  const interne = publicateur(); const h = horloge();
  const circuit = new PublicateurBruitAvecCoupeCircuit(interne, 5, 30_000, h.maintenant);
  for (let i = 0; i < 5; i += 1) await assert.rejects(circuit.publier(alerte), /fetch failed/);
  await assert.rejects(circuit.publier(alerte), CircuitOuvert);   // 6e appel : refusé
  assert.equal(interne.appels, 5);                                // le réseau n'a pas été touché
});

test("Coupe-circuit : 4 échecs ne l'ouvrent pas, et une réussite remet le compte à zéro", async () => {
  const interne = publicateur(); const h = horloge();
  const circuit = new PublicateurBruitAvecCoupeCircuit(interne, 5, 30_000, h.maintenant);
  for (let i = 0; i < 4; i += 1) await assert.rejects(circuit.publier(alerte));
  interne.enPanne = false;
  await circuit.publier(alerte);                                  // réussite : compte à zéro
  interne.enPanne = true;
  for (let i = 0; i < 4; i += 1) await assert.rejects(circuit.publier(alerte), /fetch failed/);
  assert.equal(interne.appels, 9);                                // toujours fermé
});

test("Coupe-circuit : après 30 s, un appel d'essai réussi le referme", async () => {
  const interne = publicateur(); const h = horloge();
  const circuit = new PublicateurBruitAvecCoupeCircuit(interne, 5, 30_000, h.maintenant);
  for (let i = 0; i < 5; i += 1) await assert.rejects(circuit.publier(alerte));
  h.t = 29_999;
  await assert.rejects(circuit.publier(alerte), CircuitOuvert);   // encore ouvert
  h.t = 30_000; interne.enPanne = false;
  await circuit.publier(alerte);                                  // l'appel d'essai passe
  await circuit.publier(alerte);                                  // refermé : ça passe
  assert.equal(interne.appels, 7);
});

test("Coupe-circuit : un appel d'essai raté le rouvre pour 30 s", async () => {
  const interne = publicateur(); const h = horloge();
  const circuit = new PublicateurBruitAvecCoupeCircuit(interne, 5, 30_000, h.maintenant);
  for (let i = 0; i < 5; i += 1) await assert.rejects(circuit.publier(alerte));
  h.t = 30_000;
  await assert.rejects(circuit.publier(alerte), /fetch failed/);  // l'essai rate
  h.t = 59_999;
  await assert.rejects(circuit.publier(alerte), CircuitOuvert);   // rouvert jusqu'à 60 s
  assert.equal(interne.appels, 6);
});