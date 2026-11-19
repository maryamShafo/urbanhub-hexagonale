// ===========================================================
// LA RACINE DE COMPOSITION du service Bruit
// C'est le SEUL fichier qui connaît les adaptateurs : il crée les objets
// et les branche. Les tests ne l'importent pas : ils font leur propre assemblage.
// ===========================================================
import { createServer } from "node:http";
import { Kafka, Partitioners } from "kafkajs";
import { DepotMesuresBruitJson } from "./adaptateurs/depotJson.ts";
import { gestionnaire } from "./adaptateurs/entreeHttp.ts";
import { PublicateurBruitAvecCoupeCircuit } from "./adaptateurs/coupeCircuit.ts";
import { PublicateurAlertesBruitHttp } from "./adaptateurs/publicationHttp.ts";
import { PublicateurAlertesBruitKafka, TOPIC_ALERTES_BRUIT } from "./adaptateurs/publicationKafka.ts";
import { PublicateurBruitAvecReessai } from "./adaptateurs/reessai.ts";
import { SeuilJourNuit } from "./regles.ts";
import type { PublicateurAlertesBruit } from "./ports.ts";
import { SurveillanceBruit } from "./service.ts";

const env = process.env;

// 1. Le dépôt : un fichier JSON (il remplace SQLite, derrière le même port)
const depot = new DepotMesuresBruitJson(env.BASE_BRUIT ?? "bruit.json");

// 2. Les alertes : par Kafka si KAFKA_BROKERS est donné, sinon en HTTP vers Notifications.
//    Dans les deux cas, enveloppées par le réessai (dehors) et le coupe-circuit (dedans).
async function publicateurDeBase(): Promise<PublicateurAlertesBruit> {
  if (!env.KAFKA_BROKERS) {
    return new PublicateurAlertesBruitHttp(env.URL_ALERTES ?? "http://localhost:8004/alertes-bruit");
  }
  const kafka = new Kafka({ clientId: "bruit", brokers: env.KAFKA_BROKERS.split(",") });
  const admin = kafka.admin();                       // le topic : 3 partitions
  await admin.connect();
  await admin.createTopics({ topics: [{ topic: TOPIC_ALERTES_BRUIT, numPartitions: 3 }] });
  await admin.disconnect();
  const producteur = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
  await producteur.connect();
  console.log(`Bruit publie dans Kafka (${env.KAFKA_BROKERS}), topic ${TOPIC_ALERTES_BRUIT}`);
  return new PublicateurAlertesBruitKafka(producteur);
}
const alertes = new PublicateurBruitAvecReessai(
  new PublicateurBruitAvecCoupeCircuit(await publicateurDeBase()));

// 3. La règle : seuil jour/nuit (Stratégie)
const regle = new SeuilJourNuit(65, 55);

// 4. Le cas d'utilisation reçoit tout
const service = new SurveillanceBruit(depot, alertes, regle);

// 5. L'entrée HTTP, sur le port 8003
createServer(gestionnaire(service)).listen(Number(env.PORT ?? 8003));
console.log(`Service Bruit prêt sur le port ${env.PORT ?? 8003}`);