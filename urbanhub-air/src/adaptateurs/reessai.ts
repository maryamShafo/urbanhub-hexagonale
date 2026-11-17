import type { Alerte, PublicateurAlertes } from "../ports.ts";
import { CircuitOuvert } from "./circuitOuvert.ts";

const pause = (ms: number) => new Promise((fin) => setTimeout(fin, ms));

/** Patron Decorateur : meme port, un comportement de plus autour. */
export class PublicateurAvecReessai implements PublicateurAlertes {
  #interne: PublicateurAlertes; #essais: number; #pauseMs: number;
  constructor(interne: PublicateurAlertes, essais = 3, pauseMs = 500) {
    this.#interne = interne;
    this.#essais = essais;
    this.#pauseMs = pauseMs;
  }

  async publier(alerte: Alerte) {
    for (let essai = 1; ; essai += 1) {
      try {
        return await this.#interne.publier(alerte);
      } catch (erreur) {                   // reseau coupe, delai depasse, refus
        if (erreur instanceof CircuitOuvert) throw erreur;   // il refuse aussitot : inutile de retenter
        if (essai === this.#essais) throw erreur;   // on n'avale pas l'erreur
        await pause(this.#pauseMs * essai);
      }
    }
  }
}
