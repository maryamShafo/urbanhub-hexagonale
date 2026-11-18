// ===========================================================
// LE CAS D'UTILISATION du service Bruit
// C'est le scénario : « une mesure arrive ». Il implémente le port
// primaire et ne connaît que des PORTS, jamais une base ou un réseau.
// La règle d'alerte arrive de l'extérieur : c'est le patron Stratégie.
// ===========================================================
import { heureDe } from "./domaine.ts";
import type { DepotMesuresBruit, EnregistrerMesureBruit, MesureBruit,
  PublicateurAlertesBruit } from "./ports.ts";
import type { RegleBruit } from "./regles.ts";

export class SurveillanceBruit implements EnregistrerMesureBruit {
  // des PORTS et une RÈGLE, jamais une base ou un réseau
  #depot: DepotMesuresBruit;
  #alertes: PublicateurAlertesBruit;
  #regle: RegleBruit;

  // Tout arrive en paramètre : c'est l'injection.
  constructor(depot: DepotMesuresBruit, alertes: PublicateurAlertesBruit, regle: RegleBruit) {
    this.#depot = depot;
    this.#alertes = alertes;
    this.#regle = regle;
  }

  async executer(mesure: MesureBruit) {
    // 1. ranger la mesure
    this.#depot.enregistrer(mesure);
    // 2. relire toutes les mesures du capteur pour cette heure
    const deLHeure = this.#depot.deLHeure(mesure.capteur, heureDe(mesure.horodatage));
    // 3. demander à la règle (la Stratégie) si le seuil est franchi
    if (this.#regle.estFranchie(deLHeure)) {
      // 4. prévenir, par le port
      await this.#alertes.publier(this.#regle.alerte(deLHeure));
    }
  }
}