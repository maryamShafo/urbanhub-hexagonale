// ===========================================================
// Adaptateur PRIMAIRE : lit les alertes dans Kafka et appelle le cas d'utilisation.
// Même port que l'entrée HTTP : NotificationsBruit ne sait pas d'où vient l'alerte.
// ===========================================================
import { alerteRecue } from "../domaine.ts";
import type { RecevoirAlerte } from "../ports.ts";

/** Ce qu'on reçoit pour chaque message (le morceau de kafkajs dont on a besoin). */
export type MessageKafka = { partition: number; message: { offset: string; value: Buffer | null } };

/** Traduit un message Kafka en appel du cas d'utilisation. */
export function traiterMessage(cas: RecevoirAlerte, groupe: string) {
  return async ({ partition, message }: MessageKafka) => {
    const alerte = alerteRecue(JSON.parse(String(message.value)));
    console.log(`[${groupe}] partition ${partition}, offset ${message.offset} : reçu ${alerte.identifiant}`);
    await cas.recevoir(alerte);    // une erreur remonte : Kafka n'avance pas et relivrera le message
  };
}