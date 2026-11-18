// LES PORTS du service Bruit
// Un port est un CONTRAT (une interface) écrit par l'application,
import type { AlerteBruit, MesureBruit } from "./domaine.ts";

export type { AlerteBruit, MesureBruit };

/** Port PRIMAIRE : ce que l'application offre ; un adaptateur l'appelle. */
export interface EnregistrerMesureBruit {
  executer(mesure: MesureBruit): Promise<void>;
}

/** Port SECONDAIRE : où ranger et relire les mesures. */
export interface DepotMesuresBruit {
  enregistrer(mesure: MesureBruit): void;
  deLHeure(capteur: string, heure: string): MesureBruit[];
}

/** Port SECONDAIRE : à qui envoyer l'alerte. */
export interface PublicateurAlertesBruit {
  publier(alerte: AlerteBruit): Promise<void>;
}