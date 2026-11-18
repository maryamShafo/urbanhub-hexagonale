// Adaptateur du port DepotMesuresBruit dans un FICHIER JSON.
// Il REMPLACE SQLite derrière le même port : le service ne voit pas la différence.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { DepotMesuresBruit, MesureBruit } from "../ports.ts";

export class DepotMesuresBruitJson implements DepotMesuresBruit {
  #chemin: string;

  constructor(chemin: string) {
    this.#chemin = chemin;
    if (!existsSync(chemin)) writeFileSync(chemin, "[]");   // fichier vide au départ
  }

  #lire(): MesureBruit[] {
    return JSON.parse(readFileSync(this.#chemin, "utf8"));
  }

  enregistrer(mesure: MesureBruit) {
    writeFileSync(this.#chemin, JSON.stringify([...this.#lire(), mesure]));
  }

  deLHeure(capteur: string, heure: string) {
    return this.#lire().filter((m) => m.capteur === capteur
      && m.horodatage.startsWith(heure));
  }
}