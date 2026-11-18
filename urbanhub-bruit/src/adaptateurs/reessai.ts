// ===========================================================
// PATRON DÉCORATEUR : le réessai, ajouté autour de l'envoi d'alertes
// Problème : le service Alertes peut être coupé un instant (redémarrage,
// réseau). Sans réessai, l'alerte bruit est perdue.
// Le Décorateur ENVELOPPE un publicateur du même port et lui ajoute
// un comportement (réessayer), SANS modifier ni le publicateur ni le service.
// ===========================================================
import type { AlerteBruit, PublicateurAlertesBruit } from "../ports.ts";

const pause = (ms: number) => new Promise((fin) => setTimeout(fin, ms));

export class PublicateurBruitAvecReessai implements PublicateurAlertesBruit {
  #interne: PublicateurAlertesBruit; #essais: number; #pauseMs: number;

  // interne : le publicateur qu'on enveloppe (HTTP aujourd'hui)
  constructor(interne: PublicateurAlertesBruit, essais = 3, pauseMs = 500) {
    this.#interne = interne;
    this.#essais = essais;
    this.#pauseMs = pauseMs;
  }

  async publier(alerte: AlerteBruit) {
    for (let essai = 1; ; essai += 1) {
      try {
        return await this.#interne.publier(alerte);
      } catch (erreur) {                         // réseau coupé, délai dépassé, refus
        if (essai === this.#essais) throw erreur; // au dernier essai : l'erreur remonte
        await pause(this.#pauseMs * essai);       // pause qui grandit : 0,5 s puis 1 s
      }
    }
  }
}