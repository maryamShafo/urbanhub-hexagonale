import { DatabaseSync } from "node:sqlite";    // dans Node.js depuis la 22.13
import { mesure } from "../domaine.ts";
import type { DepotMesures, Mesure } from "../ports.ts";

const SCHEMA = `CREATE TABLE IF NOT EXISTS mesure
  (capteur TEXT, polluant TEXT, valeur REAL, horodatage TEXT)`;

/** Le MEME port, une autre technologie : le service ne voit pas la difference. */
export class DepotMesuresSqlite implements DepotMesures {
  #base: DatabaseSync;

  constructor(chemin: string) {
    this.#base = new DatabaseSync(chemin);
    this.#base.exec(SCHEMA);
  }

  enregistrer(m: Mesure) {     // des parametres ?, jamais de concatenation
    this.#base.prepare("INSERT INTO mesure VALUES (?, ?, ?, ?)")
      .run(m.capteur, m.polluant, m.valeur, m.horodatage);
  }

  duJour(capteur: string, polluant: string, jour: string) {
    return this.#base.prepare("SELECT * FROM mesure WHERE capteur = ?"
      + " AND polluant = ? AND substr(horodatage, 1, 10) = ?")
      .all(capteur, polluant, jour).map((ligne) => mesure(ligne as Mesure));
  }
}
