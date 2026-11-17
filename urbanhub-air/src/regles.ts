import { alerte, jourDe } from "./domaine.ts";
import type { Alerte, Mesure } from "./ports.ts";

const moyenne = (ms: Mesure[]) =>
  ms.reduce((somme, m) => somme + m.valeur, 0) / ms.length;

// Patron Strategie : toute regle qui sait dire « franchie » et rediger l'alerte.
export interface Regle {
  estFranchie(duJour: Mesure[]): boolean;
  alerte(duJour: Mesure[]): Alerte;
}

export class SeuilMoyenneJournaliere implements Regle {
  readonly polluant: string; readonly seuil: number;  // ex. PM10 : 50
  constructor(polluant: string, seuil: number) {
    this.polluant = polluant; this.seuil = seuil;
  }
  estFranchie(duJour: Mesure[]) {
    return duJour[0]?.polluant === this.polluant && moyenne(duJour) > this.seuil;
  }
  alerte(duJour: Mesure[]) {     // un capteur, un polluant, un jour
    const { capteur, horodatage } = duJour.at(-1)!;
    return alerte({ capteur, polluant: this.polluant, jour: jourDe(horodatage),
      moyenne: moyenne(duJour), seuil: this.seuil });
  }
}
