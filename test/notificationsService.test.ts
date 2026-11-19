// Le cas d'utilisation du service Notifications, avec des adaptateurs EN MÉMOIRE.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AlertesTraiteesEnMemoire } from "../urbanhub-notifications/src/adaptateurs/traiteesMemoire.ts";
import { AlerteInvalide, alerteRecue } from "../urbanhub-notifications/src/domaine.ts";
import type { Notification } from "../urbanhub-notifications/src/ports.ts";
import { NotificationsBruit } from "../urbanhub-notifications/src/service.ts";

const alerte = alerteRecue({ identifiant: "bruit-3:bruit:2026-11-18T23", capteur: "bruit-3",
  heure: "2026-11-18T23", moyenne: 70, seuil: 55 });

test("Notifications : une alerte reçue prévient les riverains, avec un message clair", async () => {
  const prevenus: Notification[] = [];
  const service = new NotificationsBruit(new AlertesTraiteesEnMemoire(),
    { prevenir: async (n: Notification) => { prevenus.push(n); } });
  await service.recevoir(alerte);
  assert.deepEqual(prevenus.map((n) => n.message),
    ["Bruit trop fort près de bruit-3 vers 23 h : 70 dB pour un seuil de 55 dB"]);
});

test("Notifications : si prévenir échoue, l'alerte n'est pas marquée traitée", async () => {
  const traitees = new AlertesTraiteesEnMemoire();
  const service = new NotificationsBruit(traitees,
    { prevenir: async () => { throw new Error("SMS indisponible"); } });
  await assert.rejects(service.recevoir(alerte), /SMS indisponible/);
  assert.equal(traitees.contient(alerte.identifiant), false);
});

test("Notifications : une alerte mal formée est refusée", () => {
  assert.throws(() => alerteRecue({ capteur: "bruit-3" } as never), AlerteInvalide);
});