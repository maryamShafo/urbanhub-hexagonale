// Le domaine : des donnees et un vocabulaire, aucun import technique.
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
export class MesureInvalide extends Error {}

/** Une mesure d'un capteur, en microgrammes par m3. */
export type Mesure = Readonly<{
  capteur: string; polluant: string; valeur: number; horodatage: string }>;

/** Une alerte : une seule par capteur, polluant et jour. */
export type Alerte = Readonly<{ capteur: string; polluant: string;
  jour: string; moyenne: number; seuil: number; identifiant: string }>;

export function mesure(m: Mesure): Mesure {
  const complete = m.capteur && m.polluant && Number.isFinite(m.valeur);
  if (!complete || !ISO.test(m.horodatage)) {
    throw new MesureInvalide(
      "capteur, polluant, valeur et horodatage ISO requis");
  }
  return Object.freeze({ ...m });
}
export function alerte(a: Omit<Alerte, "identifiant">): Alerte {
  const identifiant = `${a.capteur}:${a.polluant}:${a.jour}`;
  return Object.freeze({ ...a, identifiant });
}
/** "2026-11-17T08:00:00" -> "2026-11-17" */
export const jourDe = (h: string) => h.slice(0, 10);
