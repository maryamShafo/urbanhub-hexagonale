import type { IncomingMessage, ServerResponse } from "node:http";
import { MesureInvalide, mesure } from "../domaine.ts";
import type { EnregistrerMesure } from "../ports.ts";

const lireCorps = async (requete: IncomingMessage) => {
  let corps = "";
  for await (const morceau of requete) corps += morceau;
  return corps;
};

/** Adaptateur PRIMAIRE : traduit POST /mesures en appel du cas d'utilisation. */
export function gestionnaire(cas: EnregistrerMesure) {
  return async (requete: IncomingMessage, reponse: ServerResponse) => {
    try {
      await cas.executer(mesure(JSON.parse(await lireCorps(requete))));
      reponse.writeHead(202).end();
    } catch (erreur) {
      const invalide = erreur instanceof MesureInvalide
        || erreur instanceof SyntaxError;
      if (!invalide) console.error(erreur);  // on n'avale rien : on journalise
      reponse.writeHead(invalide ? 422 : 500).end(invalide ? erreur.message : "");
    }
  };
}
