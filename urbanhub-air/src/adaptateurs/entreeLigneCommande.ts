// Expérience 3 : une entrée de plus, la ligne de commande.
import { mesure } from "../domaine.ts";
import type { EnregistrerMesure } from "../ports.ts";

/** Adaptateur PRIMAIRE : traduit des arguments en appel du cas d'utilisation. */
export async function depuisArguments(args: string[], cas: EnregistrerMesure) {
  const [capteur, polluant, valeur, horodatage] = args;
  await cas.executer(mesure({ capteur, polluant, valeur: Number(valeur), horodatage }));
}