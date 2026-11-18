// ===========================================================
// PATRON STRATÉGIE : la règle d'alerte, interchangeable
// Problème : tous les lieux n'ont pas la même règle. Une rue suit
// le seuil jour/nuit, mais près d'un hôpital ou d'une école le seuil
// est plus bas, jour et nuit. Sans Stratégie, il faudrait ajouter
// des if dans le service à chaque nouveau lieu.
// ===========================================================
import { alerteBruit, heureDe } from "./domaine.ts";
import type { AlerteBruit, MesureBruit } from "./ports.ts";

const moyenne = (ms: MesureBruit[]) =>
  ms.reduce((somme, m) => somme + m.decibels, 0) / ms.length;

/** La nuit va de 22 h à 6 h. "2026-11-18T23" -> true */
const estLaNuit = (heure: string) => {
  const h = Number(heure.slice(11, 13));
  return h >= 22 || h < 6;
};

// Toute règle doit savoir dire « franchie » et rédiger l'alerte.
export interface RegleBruit {
  estFranchie(deLHeure: MesureBruit[]): boolean;
  alerte(deLHeure: MesureBruit[]): AlerteBruit;
}

/** Stratégie n°1 : un seuil le jour (6 h - 22 h), un autre la nuit (22 h - 6 h). */
export class SeuilJourNuit implements RegleBruit {
  readonly jour: number; readonly nuit: number;     // ex. 65 et 55 dB
  constructor(jour: number, nuit: number) {
    this.jour = jour; this.nuit = nuit;
  }
  #seuil(deLHeure: MesureBruit[]) {
    return estLaNuit(heureDe(deLHeure[0].horodatage)) ? this.nuit : this.jour;
  }
  estFranchie(deLHeure: MesureBruit[]) {
    return moyenne(deLHeure) > this.#seuil(deLHeure);
  }
  alerte(deLHeure: MesureBruit[]) {
    const { capteur, horodatage } = deLHeure.at(-1)!;
    return alerteBruit({ capteur, heure: heureDe(horodatage),
      moyenne: moyenne(deLHeure), seuil: this.#seuil(deLHeure) });
  }
}

/** Stratégie n°2 : zone sensible (hôpital, école), un seul seuil, jour et nuit. */
export class SeuilZoneSensible implements RegleBruit {
  readonly seuil: number;                            // ex. 50 dB
  constructor(seuil: number) {
    this.seuil = seuil;
  }
  estFranchie(deLHeure: MesureBruit[]) {
    return moyenne(deLHeure) > this.seuil;
  }
  alerte(deLHeure: MesureBruit[]) {
    const { capteur, horodatage } = deLHeure.at(-1)!;
    return alerteBruit({ capteur, heure: heureDe(horodatage),
      moyenne: moyenne(deLHeure), seuil: this.seuil });
  }
}