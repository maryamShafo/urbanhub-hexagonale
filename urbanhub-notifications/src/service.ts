// ===========================================================
// LE CAS D'UTILISATION : une alerte bruit arrive, on prévient les riverains.
// Il ne connaît que des PORTS, jamais une base ou un réseau.
// ===========================================================
import { notificationDe } from "./domaine.ts";
import type { AlerteRecue, AlertesTraitees, RecevoirAlerte, Riverains } from "./ports.ts";

export class NotificationsBruit implements RecevoirAlerte {
  #traitees: AlertesTraitees;
  #riverains: Riverains;

  constructor(traitees: AlertesTraitees, riverains: Riverains) {
    this.#traitees = traitees;
    this.#riverains = riverains;
  }

  async recevoir(alerte: AlerteRecue) {
    // un doublon (même identifiant) n'agit pas : c'est l'idempotence
    if (this.#traitees.contient(alerte.identifiant)) return;
    await this.#riverains.prevenir(notificationDe(alerte));
    // on ne la marque « traitée » qu'APRÈS avoir prévenu :
    // si prévenir échoue, un nouvel envoi pourra réessayer
    this.#traitees.ajouter(alerte.identifiant);
  }
}