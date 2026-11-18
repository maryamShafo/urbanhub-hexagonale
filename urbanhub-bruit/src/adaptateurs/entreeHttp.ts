// Adaptateur PRIMAIRE : traduit POST /mesures-bruit en appel du cas d'utilisation.
import type { IncomingMessage, ServerResponse } from "node:http";
import { MesureBruitInvalide, mesureBruit } from "../domaine.ts";
import type { EnregistrerMesureBruit } from "../ports.ts";

const lireCorps = async (requete: IncomingMessage) => {
  let corps = "";
  for await (const morceau of requete) corps += morceau;
  return corps;
};

export function gestionnaire(cas: EnregistrerMesureBruit) {
  return async (requete: IncomingMessage, reponse: ServerResponse) => {
    try {
      await cas.executer(mesureBruit(JSON.parse(await lireCorps(requete))));
      reponse.writeHead(202).end();                      // 202 : mesure acceptée
    } catch (erreur) {
      const invalide = erreur instanceof MesureBruitInvalide
        || erreur instanceof SyntaxError;               // mesure ou JSON mal formé
      if (!invalide) console.error(erreur);             // on n'avale rien : on journalise
      reponse.writeHead(invalide ? 422 : 500).end(invalide ? (erreur as Error).message : "");
    }
  };
}