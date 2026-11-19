// ===========================================================
// Adaptateur SECONDAIRE : publie l'alerte bruit dans Kafka (un journal de
// messages, gardés et relisibles). Même port que l'adaptateur HTTP :
// le cas d'utilisation ne change pas d'une ligne.
// ===========================================================
import type { AlerteBruit, PublicateurAlertesBruit } from "../ports.ts";

export const TOPIC_ALERTES_BRUIT = "alertes-bruit";

/** Le morceau de la bibliothèque Kafka dont on a besoin (kafkajs). */
export interface Producteur {
  send(envoi: { topic: string; messages: { key: string; value: string }[] }): Promise<unknown>;
}

export class PublicateurAlertesBruitKafka implements PublicateurAlertesBruit {
  #producteur: Producteur;

  constructor(producteur: Producteur) {
    this.#producteur = producteur;           // injecté : l'objet de la bibliothèque qui envoie
  }

  async publier(alerte: AlerteBruit) {
    await this.#producteur.send({
      topic: TOPIC_ALERTES_BRUIT,
      messages: [{
        key: alerte.capteur,                 // même capteur, même partition, même ordre
        value: JSON.stringify(alerte),       // l'identifiant voyage avec l'alerte
      }],
    });
  }
}