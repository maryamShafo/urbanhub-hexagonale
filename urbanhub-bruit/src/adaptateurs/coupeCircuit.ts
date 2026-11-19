// ===========================================================
// DÉCORATEUR n°2 : le coupe-circuit (M. Nygard, « Release It! », 2007)
// Problème : si Notifications est en panne longtemps, chaque mesure perd
// du temps à réessayer, et Notifications reçoit une rafale d'appels à son retour.
// Solution : après 5 échecs d'affilée, le circuit S'OUVRE pendant 30 s :
// les appels échouent aussitôt, sans toucher le réseau. Puis UN appel d'essai :
// s'il réussit, le circuit se referme ; s'il rate, il se rouvre pour 30 s.
// ===========================================================
import type { AlerteBruit, PublicateurAlertesBruit } from "../ports.ts";
import { CircuitOuvert } from "./circuitOuvert.ts";

export class PublicateurBruitAvecCoupeCircuit implements PublicateurAlertesBruit {
  #interne: PublicateurAlertesBruit;
  #seuil: number;                 // nombre d'échecs d'affilée avant d'ouvrir (5)
  #dureeMs: number;               // durée d'ouverture (30 s)
  #maintenant: () => number;      // l'horloge, injectée pour pouvoir la tester
  #echecs = 0;
  #ouvertJusqua = 0;              // 0 = circuit fermé

  constructor(interne: PublicateurAlertesBruit, seuil = 5, dureeMs = 30_000,
              maintenant: () => number = Date.now) {
    this.#interne = interne;
    this.#seuil = seuil;
    this.#dureeMs = dureeMs;
    this.#maintenant = maintenant;
  }

  async publier(alerte: AlerteBruit) {
    // OUVERT : on refuse tout de suite, sans appeler le réseau
    if (this.#ouvertJusqua > 0 && this.#maintenant() < this.#ouvertJusqua) {
      throw new CircuitOuvert();
    }
    // FERMÉ, ou SEMI-OUVERT (les 30 s sont passées : cet appel est l'appel d'essai)
    try {
      await this.#interne.publier(alerte);
      this.#echecs = 0;                         // réussite : le circuit se referme
      this.#ouvertJusqua = 0;
    } catch (erreur) {
      this.#echecs += 1;
      const essaiRate = this.#ouvertJusqua > 0; // on était en semi-ouvert
      if (essaiRate || this.#echecs >= this.#seuil) {
        this.#ouvertJusqua = this.#maintenant() + this.#dureeMs;   // on (r)ouvre pour 30 s
      }
      throw erreur;                             // on n'avale pas l'erreur
    }
  }
}