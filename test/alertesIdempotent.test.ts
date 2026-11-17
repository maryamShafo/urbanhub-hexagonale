import { test } from "node:test";
import assert from "node:assert/strict";
import { ReceptionAlertes } from "../urbanhub-alertes/src/service.ts";

test("une alerte recue deux fois ne previent qu'une fois", () => {
  const prevenus: string[] = [];
  const reception = new ReceptionAlertes({ prevenir: (a) => prevenus.push(a.identifiant) });
  const alerte = { identifiant: "capteur-12:PM10:2026-11-17", moyenne: 55 };
  reception.recevoir(alerte);
  reception.recevoir(alerte);              // le message est livre deux fois
  assert.deepEqual(prevenus, ["capteur-12:PM10:2026-11-17"]);
});
