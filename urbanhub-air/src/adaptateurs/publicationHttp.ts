import type { Alerte, PublicateurAlertes } from "../ports.ts";

/** Adaptateur SECONDAIRE : publie l'alerte au microservice Alertes. */
export class PublicateurAlertesHttp implements PublicateurAlertes {
  #url: string;
  #delaiMs: number;

  constructor(url: string, delaiMs = 2000) {
    this.#url = url;
    this.#delaiMs = delaiMs;               // jamais d'appel reseau sans delai
  }

  async publier(alerte: Alerte) {
    const reponse = await fetch(this.#url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alerte),        // l'identifiant voyage avec l'alerte
      signal: AbortSignal.timeout(this.#delaiMs),
    });
    if (reponse.status !== 202) {
      throw new Error(`Alertes a repondu ${reponse.status}`);
    }
  }
}
