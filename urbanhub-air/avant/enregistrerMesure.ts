// AVANT l'hexagone : la regle, la base et le reseau dans la meme fonction.
import { DatabaseSync } from "node:sqlite";
import type { Mesure } from "../src/domaine.ts";

const base = new DatabaseSync(process.env.BASE_MESURES ?? "mesures.db");
base.exec(`CREATE TABLE IF NOT EXISTS mesure
  (capteur TEXT, polluant TEXT, valeur REAL, horodatage TEXT)`);

export async function enregistrerMesure({ capteur, polluant, valeur, horodatage }: Mesure) {
  base.prepare("INSERT INTO mesure VALUES (?, ?, ?, ?)")
    .run(capteur, polluant, valeur, horodatage);
  const jour = horodatage.slice(0, 10);
  const { moyenne } = base.prepare("SELECT avg(valeur) AS moyenne FROM mesure"
    + " WHERE capteur = ? AND polluant = ? AND substr(horodatage, 1, 10) = ?")
    .get(capteur, polluant, jour) as { moyenne: number };
  if (polluant === "PM10" && moyenne > 50) {        // la regle metier, noyee ici
    await fetch(process.env.URL_ALERTES ?? "http://localhost:8002/alertes", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ capteur, polluant, jour, moyenne, seuil: 50 }),
    });
  }
}
