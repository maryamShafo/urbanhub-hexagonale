// Adaptateur RÉEL du port DepotMesuresBruit : une base SQLite (une base dans un fichier).
// C'est le SEUL fichier du service Bruit qui importe node:sqlite.
import { DatabaseSync } from "node:sqlite";
import { mesureBruit } from "../domaine.ts";
import type { DepotMesuresBruit, MesureBruit } from "../ports.ts";

const SCHEMA = `CREATE TABLE IF NOT EXISTS mesure_bruit
  (capteur TEXT, decibels REAL, horodatage TEXT)`;

/** Le MÊME port que la mémoire, une autre technologie : le service ne voit pas la différence. */
export class DepotMesuresBruitSqlite implements DepotMesuresBruit {
  #base: DatabaseSync;

  constructor(chemin: string) {
    this.#base = new DatabaseSync(chemin);
    this.#base.exec(SCHEMA);
  }

  enregistrer(m: MesureBruit) {     // des paramètres ?, jamais de concaténation
    this.#base.prepare("INSERT INTO mesure_bruit VALUES (?, ?, ?)")
      .run(m.capteur, m.decibels, m.horodatage);
  }

  deLHeure(capteur: string, heure: string) {
    // substr(horodatage, 1, 13) garde "2026-11-18T22" : la date et l'heure
    return this.#base.prepare("SELECT * FROM mesure_bruit WHERE capteur = ?"
      + " AND substr(horodatage, 1, 13) = ?")
      .all(capteur, heure).map((ligne) => mesureBruit(ligne as MesureBruit));
  }
}