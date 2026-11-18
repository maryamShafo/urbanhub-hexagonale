// Adaptateur RÉEL du port PublicateurAlertesBruit : il envoie l'alerte
// au microservice Alertes, en HTTP. C'est le seul fichier qui appelle fetch.
import type { AlerteBruit, PublicateurAlertesBruit } from "../ports.ts";

export class PublicateurAlertesBruitHttp implements PublicateurAlertesBruit {
  #url: string;
  #delaiMs: number;

  constructor(url: string, delaiMs = 2000) {
    this.#url = url;
    this.#delaiMs = delaiMs;               // jamais d'appel réseau sans délai
  }

  async publier(alerte: AlerteBruit) {
    const reponse = await fetch(this.#url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alerte),        // l'identifiant voyage avec l'alerte
      signal: AbortSignal.timeout(this.#delaiMs),
    });
    if (reponse.status !== 202) {
      throw new Error(`Alertes a répondu ${reponse.status}`);
    }
  }
}