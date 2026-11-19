// Adaptateur du port AlertesTraitees, EN MÉMOIRE (un Set : une liste sans doublon).
import type { AlertesTraitees } from "../ports.ts";

export class AlertesTraiteesEnMemoire implements AlertesTraitees {
  #identifiants = new Set<string>();

  contient(identifiant: string) {
    return this.#identifiants.has(identifiant);
  }

  ajouter(identifiant: string) {
    this.#identifiants.add(identifiant);
  }
}