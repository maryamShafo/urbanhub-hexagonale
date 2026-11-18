// ===========================================================
// LA RACINE DE COMPOSITION du service Bruit
// C'est le SEUL fichier qui connaît les adaptateurs : il crée les objets
// et les branche. Les tests ne l'importent pas : ils font leur propre assemblage.
// ===========================================================
import { createServer } from "node:http";
import { DepotMesuresBruitJson } from "./adaptateurs/depotJson.ts";import { gestionnaire } from "./adaptateurs/entreeHttp.ts";
import { PublicateurAlertesBruitHttp } from "./adaptateurs/publicationHttp.ts";
import { PublicateurBruitAvecReessai } from "./adaptateurs/reessai.ts";
import { SeuilJourNuit } from "./regles.ts";
import { SurveillanceBruit } from "./service.ts";

const env = process.env;

// 1. Le dépôt : un fichier JSON (il remplace SQLite, derrière le même port)
const depot = new DepotMesuresBruitJson(env.BASE_BRUIT ?? "bruit.json");
// 2. Les alertes : HTTP vers Alertes, enveloppé par le réessai (Décorateur)
const alertes = new PublicateurBruitAvecReessai(new PublicateurAlertesBruitHttp(
  env.URL_ALERTES ?? "http://localhost:8002/alertes"));

// 3. La règle : seuil jour/nuit (Stratégie)
const regle = new SeuilJourNuit(65, 55);

// 4. Le cas d'utilisation reçoit tout
const service = new SurveillanceBruit(depot, alertes, regle);

// 5. L'entrée HTTP, sur le port 8003
createServer(gestionnaire(service)).listen(Number(env.PORT ?? 8003));
console.log(`Service Bruit prêt sur le port ${env.PORT ?? 8003}`);