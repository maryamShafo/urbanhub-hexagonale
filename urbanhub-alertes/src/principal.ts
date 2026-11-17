import { createServer } from "node:http";
import { gestionnaire } from "./entreeHttp.ts";
import { type Operateurs, ReceptionAlertes } from "./service.ts";

const operateursParJournal: Operateurs = {           // adaptateur secondaire minimal
  prevenir: (a) => console.log(`ALERTE ${a.identifiant} : moyenne ${a.moyenne}`),
};

createServer(gestionnaire(new ReceptionAlertes(operateursParJournal)))
  .listen(Number(process.env.PORT ?? 8002));
