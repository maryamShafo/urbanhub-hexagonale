import type { DepotMesures, Mesure } from "../ports.ts";

/** Adaptateur du port DepotMesures, pour les tests et le prototype. */
export class DepotMesuresEnMemoire implements DepotMesures {
  #mesures: Mesure[] = [];

  enregistrer(mesure: Mesure) {
    this.#mesures.push(mesure);
  }

  duJour(capteur: string, polluant: string, jour: string) {
    return this.#mesures.filter((m) => m.capteur === capteur
      && m.polluant === polluant && m.horodatage.startsWith(jour));
  }
}
