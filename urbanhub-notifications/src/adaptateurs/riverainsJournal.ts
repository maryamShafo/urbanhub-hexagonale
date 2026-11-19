// Adaptateur du port Riverains : il écrit la notification dans le journal (la console).
// Plus tard, un autre adaptateur pourrait envoyer un SMS, sans toucher au service.
import type { Notification, Riverains } from "../ports.ts";

export class RiverainsJournal implements Riverains {
  async prevenir(n: Notification) {
    console.log(`NOTIFICATION ${n.identifiant} : ${n.message}`);
  }
}