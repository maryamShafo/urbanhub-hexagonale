import type { Alerte, PublicateurAlertes } from "../ports.ts";

/** Le morceau de la bibliotheque Kafka dont on a besoin (kafkajs, confluent). */
export interface Producteur {
  send(envoi: { topic: string; messages: { key: string; value: string }[] }): Promise<unknown>;
}

/** Adaptateur SECONDAIRE : publie l'alerte dans le topic « alertes » de Kafka. */
export class PublicateurAlertesKafka implements PublicateurAlertes {
  #producteur: Producteur;

  constructor(producteur: Producteur) {
    this.#producteur = producteur;         // injecte : l'objet de la bibliotheque qui envoie
  }

  async publier(alerte: Alerte) {
    await this.#producteur.send({
      topic: "alertes",
      messages: [{
        key: alerte.capteur,               // meme capteur, meme partition, meme ordre
        value: JSON.stringify(alerte),     // l'identifiant voyage avec l'alerte
      }],
    });
  }
}
