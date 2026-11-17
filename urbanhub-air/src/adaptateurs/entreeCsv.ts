// Adaptateur PRIMAIRE : un fichier CSV pilote le meme cas d'utilisation.
import { readFileSync } from "node:fs";
import { mesure } from "../domaine.ts";
import type { EnregistrerMesure } from "../ports.ts";

export async function importerCsv(chemin: string, enregistrerMesure: EnregistrerMesure) {
  const lignes = readFileSync(chemin, "utf8").trim().split(/\r?\n/).slice(1);
  for (const ligne of lignes) {
    const [capteur, polluant, valeur, horodatage] = ligne.split(",");
    await enregistrerMesure.executer(mesure({ capteur, polluant,
      valeur: Number(valeur), horodatage }));
  }
}
