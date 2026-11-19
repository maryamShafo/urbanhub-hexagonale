// Adaptateur PRIMAIRE : reçoit POST /alertes-bruit et appelle le cas d'utilisation.
import type { IncomingMessage, ServerResponse } from "node:http";
import { AlerteInvalide, alerteRecue } from "../domaine.ts";
import type { RecevoirAlerte } from "../ports.ts";

const lireCorps = async (requete: IncomingMessage) => {
  let corps = "";
  for await (const morceau of requete) corps += morceau;
  return corps;
};

export function gestionnaire(cas: RecevoirAlerte) {
  return async (requete: IncomingMessage, reponse: ServerResponse) => {
    try {
      const alerte = alerteRecue(JSON.parse(await lireCorps(requete)));
      console.log(`reçu ${alerte.identifiant}`);
      await cas.recevoir(alerte);
      reponse.writeHead(202).end();                      // 202 : alerte reçue
    } catch (erreur) {
      const invalide = erreur instanceof AlerteInvalide
        || erreur instanceof SyntaxError;               // alerte ou JSON mal formé
      if (!invalide) console.error(erreur);             // on n'avale rien : on journalise
      reponse.writeHead(invalide ? 422 : 500).end(invalide ? (erreur as Error).message : "");
    }
  };
}