/** Ce que le service Alertes lit d'une alerte : un identifiant, une moyenne. */
export type AlerteRecue = { identifiant: string; moyenne: number };

/** Port secondaire : qui previent les operateurs. */
export interface Operateurs {
  prevenir(alerte: AlerteRecue): void;
}

/** Consommateur IDEMPOTENT : un message livre deux fois n'agit qu'une fois. */
export class ReceptionAlertes {
  #operateurs: Operateurs;
  #dejaTraitees = new Set<string>();       // en production : une table

  constructor(operateurs: Operateurs) {
    this.#operateurs = operateurs;
  }

  recevoir(alerte: AlerteRecue) {
    if (this.#dejaTraitees.has(alerte.identifiant)) return;   // doublon : ignore
    this.#dejaTraitees.add(alerte.identifiant);
    this.#operateurs.prevenir(alerte);
  }
}
