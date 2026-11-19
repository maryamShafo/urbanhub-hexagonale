// LA RACINE DE COMPOSITION du service Notifications : le seul fichier qui branche tout.
import { createServer } from "node:http";
import { gestionnaire } from "./adaptateurs/entreeHttp.ts";
import { RiverainsJournal } from "./adaptateurs/riverainsJournal.ts";
import { AlertesTraiteesEnMemoire } from "./adaptateurs/traiteesMemoire.ts";
import { NotificationsBruit } from "./service.ts";

const port = Number(process.env.PORT ?? 8004);
const service = new NotificationsBruit(new AlertesTraiteesEnMemoire(), new RiverainsJournal());

createServer(gestionnaire(service)).listen(port);
console.log(`Service Notifications prêt sur le port ${port}`);