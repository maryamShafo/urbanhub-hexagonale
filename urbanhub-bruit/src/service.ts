// ===========================================================
// LE CAS D'UTILISATION du service Bruit
// C'est le scénario : « une mesure arrive ». Il implémente le port
// primaire et ne connaît que des PORTS, jamais une base ou un réseau.
// ===========================================================
import { alerteBruit, heureDe } from "./domaine.ts";
import type { DepotMesuresBruit, EnregistrerMesureBruit, MesureBruit,
  PublicateurAlertesBruit } from "./ports.ts";

const SEUIL_JOUR = 65;   // dB, de 6 h à 22 h
const SEUIL_NUIT = 55;   // dB, de 22 h à 6 h

/** La nuit va de 22 h à 6 h. "2026-11-18T23" -> true */
const estLaNuit = (heure: string) => {
  const h = Number(heure.slice(11, 13));
  return h >= 22 || h < 6;
};

const moyenne = (ms: MesureBruit[]) =>
  ms.reduce((somme, m) => somme + m.decibels, 0) / ms.length;

export class SurveillanceBruit implements EnregistrerMesureBruit {
  // des PORTS, jamais une base ou un réseau
  #depot: DepotMesuresBruit;
  #alertes: PublicateurAlertesBruit;

  // Les ports arrivent en paramètre : c'est l'injection.
  // Le service ne fabrique jamais lui-même son dépôt.
  constructor(depot: DepotMesuresBruit, alertes: PublicateurAlertesBruit) {
    this.#depot = depot;
    this.#alertes = alertes;
  }

  async executer(mesure: MesureBruit) {
    // 1. ranger la mesure
    this.#depot.enregistrer(mesure);
    // 2. relire toutes les mesures du capteur pour cette heure
    const heure = heureDe(mesure.horodatage);
    const deLHeure = this.#depot.deLHeure(mesure.capteur, heure);
    // 3. la règle métier : moyenne de l'heure au-dessus du seuil du jour ou de la nuit
    const seuil = estLaNuit(heure) ? SEUIL_NUIT : SEUIL_JOUR;
    const m = moyenne(deLHeure);
    if (m > seuil) {
      // 4. prévenir, par le port
      await this.#alertes.publier(alerteBruit({ capteur: mesure.capteur, heure,
        moyenne: m, seuil }));
    }
  }
}