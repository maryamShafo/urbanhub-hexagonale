import { jourDe } from "./domaine.ts";
import type { DepotMesures, EnregistrerMesure, Mesure, PublicateurAlertes } from "./ports.ts";
import type { Regle } from "./regles.ts";

/** Le cas d'utilisation : il implemente le port primaire EnregistrerMesure. */
export class SurveillanceQualiteAir implements EnregistrerMesure {
  // des PORTS, jamais une base ou un reseau
  #depot: DepotMesures;
  #alertes: PublicateurAlertes;
  #regle: Regle;

  constructor(depot: DepotMesures, alertes: PublicateurAlertes, regle: Regle) {
    this.#depot = depot;
    this.#alertes = alertes;
    this.#regle = regle;
  }

  async executer(mesure: Mesure) {
    this.#depot.enregistrer(mesure);
    const duJour = this.#depot.duJour(mesure.capteur, mesure.polluant,
      jourDe(mesure.horodatage));
    if (this.#regle.estFranchie(duJour)) {
      await this.#alertes.publier(this.#regle.alerte(duJour));
    }
  }
}
