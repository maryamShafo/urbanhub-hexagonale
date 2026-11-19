// Adaptateur du port AlertesTraitees dans un FICHIER JSON.
// Pourquoi : en mémoire, la liste est perdue à chaque redémarrage. Après un rejeu Kafka,
// le service renverrait alors toutes les anciennes notifications. Le fichier la garde.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { AlertesTraitees } from "../ports.ts";

export class AlertesTraiteesFichier implements AlertesTraitees {
  #chemin: string;
  #identifiants: Set<string>;

  constructor(chemin: string) {
    this.#chemin = chemin;
    this.#identifiants = new Set(existsSync(chemin) ? JSON.parse(readFileSync(chemin, "utf8")) : []);
  }

  contient(identifiant: string) {
    return this.#identifiants.has(identifiant);
  }

  ajouter(identifiant: string) {
    this.#identifiants.add(identifiant);
    writeFileSync(this.#chemin, JSON.stringify([...this.#identifiants]));
  }
}