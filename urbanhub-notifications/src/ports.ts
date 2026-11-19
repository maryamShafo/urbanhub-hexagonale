// ===========================================================
// LES PORTS du service Notifications
// ===========================================================
import type { AlerteRecue, Notification } from "./domaine.ts";

export type { AlerteRecue, Notification };

/** Port PRIMAIRE : ce que le service offre. Une entrée (HTTP, Kafka) l'appelle. */
export interface RecevoirAlerte {
  recevoir(alerte: AlerteRecue): Promise<void>;
}

/** Port SECONDAIRE n°1 : se souvenir des alertes déjà traitées (pour les doublons).
 *  En mémoire pour les tests, une table en production. */
export interface AlertesTraitees {
  contient(identifiant: string): boolean;
  ajouter(identifiant: string): void;
}

/** Port SECONDAIRE n°2 : prévenir les riverains (journal, SMS, appli...). */
export interface Riverains {
  prevenir(notification: Notification): Promise<void>;
}