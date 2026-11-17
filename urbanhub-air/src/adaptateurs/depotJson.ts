// Expérience 2 : un nouvel adaptateur du port DepotMesures, dans un fichier JSON.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { DepotMesures, Mesure } from "../ports.ts";

/** Le MEME port, une troisième technologie : un simple fichier JSON. */
export class DepotMesuresJson implements DepotMesures {
  #chemin: string;

  constructor(chemin: string) {
    this.#chemin = chemin;
    if (!existsSync(chemin)) writeFileSync(chemin, "[]");
  }

  #lire(): Mesure[] {
    return JSON.parse(readFileSync(this.#chemin, "utf8"));
  }

  enregistrer(mesure: Mesure) {
    writeFileSync(this.#chemin, JSON.stringify([...this.#lire(), mesure]));
  }

  duJour(capteur: string, polluant: string, jour: string) {
    return this.#lire().filter((m) => m.capteur === capteur
      && m.polluant === polluant && m.horodatage.startsWith(jour));
  }
}