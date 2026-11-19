// LA RACINE DE COMPOSITION du service Notifications : le seul fichier qui branche tout.
// Deux entrées vers le même cas d'utilisation : HTTP toujours, et Kafka si KAFKA_BROKERS est donné.
import { createServer } from "node:http";
import { Kafka } from "kafkajs";
import { traiterMessage } from "./adaptateurs/entreeKafka.ts";
import { gestionnaire } from "./adaptateurs/entreeHttp.ts";
import { RiverainsJournal } from "./adaptateurs/riverainsJournal.ts";
import { AlertesTraiteesEnMemoire } from "./adaptateurs/traiteesMemoire.ts";
import { NotificationsBruit } from "./service.ts";

const env = process.env;
const port = Number(env.PORT ?? 8004);
const service = new NotificationsBruit(new AlertesTraiteesEnMemoire(), new RiverainsJournal());

// Entrée 1 : HTTP
createServer(gestionnaire(service)).listen(port);
console.log(`Service Notifications prêt sur le port ${port}`);

// Entrée 2 : Kafka. GROUPE = le groupe de consommateurs (chaque groupe lit tout le topic).
if (env.KAFKA_BROKERS) {
  const groupe = env.GROUPE ?? "notifications";
  const kafka = new Kafka({ clientId: `notifications-${groupe}`, brokers: env.KAFKA_BROKERS.split(",") });
  const consommateur = kafka.consumer({ groupId: groupe });
  await consommateur.connect();
  await consommateur.subscribe({ topic: "alertes-bruit", fromBeginning: env.DEPUIS_LE_DEBUT === "oui" });
  await consommateur.run({ eachMessage: traiterMessage(service, groupe) });
  console.log(`Notifications lit Kafka (${env.KAFKA_BROKERS}), groupe ${groupe}`);
}