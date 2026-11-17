import { createServer } from "node:http";
import { DepotMesuresSqlite } from "./adaptateurs/depotSqlite.ts";
import { gestionnaire } from "./adaptateurs/entreeHttp.ts";
import { PublicateurAlertesHttp } from "./adaptateurs/publicationHttp.ts";
import { PublicateurAvecReessai } from "./adaptateurs/reessai.ts";
import { SeuilMoyenneJournaliere } from "./regles.ts";
import { SurveillanceQualiteAir } from "./service.ts";

// La racine de composition : le SEUL fichier qui connait les adaptateurs.
// Les tests ne l'importent pas : ils assemblent leurs propres adaptateurs.
const env = process.env;
const depot = new DepotMesuresSqlite(env.BASE_MESURES ?? "mesures.db");
const alertes = new PublicateurAvecReessai(new PublicateurAlertesHttp(
  env.URL_ALERTES ?? "http://localhost:8002/alertes"));
const regle = new SeuilMoyenneJournaliere("PM10", 50);
const service = new SurveillanceQualiteAir(depot, alertes, regle);

createServer(gestionnaire(service)).listen(Number(env.PORT ?? 8001));
