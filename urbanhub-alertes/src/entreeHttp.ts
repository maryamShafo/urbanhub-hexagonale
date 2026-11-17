import type { IncomingMessage, ServerResponse } from "node:http";
import type { ReceptionAlertes } from "./service.ts";

/** Adaptateur PRIMAIRE : POST /alertes devient un appel de la reception. */
export function gestionnaire(reception: ReceptionAlertes, journal = console.log) {
  return async (requete: IncomingMessage, reponse: ServerResponse) => {
    let corps = "";
    for await (const morceau of requete) corps += morceau;
    const alerte = JSON.parse(corps);
    journal(`recu ${alerte.identifiant}`);
    reception.recevoir(alerte);
    reponse.writeHead(202).end();
  };
}
