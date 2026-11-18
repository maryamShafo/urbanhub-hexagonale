// Adaptateur du port DepotMesuresBruit, EN MÉMOIRE : un simple tableau.
// Il sert aux tests : pas de base, rien sur le disque.
import type { DepotMesuresBruit, MesureBruit } from "../ports.ts";

export class DepotMesuresBruitEnMemoire implements DepotMesuresBruit {
  #mesures: MesureBruit[] = [];

  enregistrer(mesure: MesureBruit) {
    this.#mesures.push(mesure);
  }

  deLHeure(capteur: string, heure: string) {
    return this.#mesures.filter((m) => m.capteur === capteur
      && m.horodatage.startsWith(heure));
  }
}