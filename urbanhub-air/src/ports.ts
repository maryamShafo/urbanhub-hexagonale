// Les ports : les contrats que l'application ecrit, dans son vocabulaire.
// Une interface TypeScript est effacee a l'execution : un test de contrat
// fait respecter chaque port par tous ses adaptateurs.
import type { Alerte, Mesure } from "./domaine.ts";

export type { Alerte, Mesure };

/** Port PRIMAIRE : ce que l'application offre ; un adaptateur l'appelle. */
export interface EnregistrerMesure {
  executer(mesure: Mesure): Promise<void>;
}

/** Port SECONDAIRE : ce dont elle a besoin ; un adaptateur l'implemente. */
export interface DepotMesures {
  enregistrer(mesure: Mesure): void;
  duJour(capteur: string, polluant: string, jour: string): Mesure[];
}

/** Port SECONDAIRE. */
export interface PublicateurAlertes {
  publier(alerte: Alerte): Promise<void>;
}
