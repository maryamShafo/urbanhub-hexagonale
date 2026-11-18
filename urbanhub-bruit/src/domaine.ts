// Le domaine du service Bruit : des données et un vocabulaire, aucun import technique.
// C'est le CENTRE de l'hexagone : les objets du métier (la mesure,l'alerte) et leurs règles.
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
export class MesureBruitInvalide extends Error {}

/** Une mesure d'un capteur de bruit, en décibels (dB). */
export type MesureBruit = Readonly<{
  capteur: string; decibels: number; horodatage: string }>;

/** Une alerte bruit : une seule par capteur et par heure. */
export type AlerteBruit = Readonly<{ capteur: string; heure: string;
  moyenne: number; seuil: number; identifiant: string }>;

export function mesureBruit(m: MesureBruit): MesureBruit {
  const complete = m.capteur && Number.isFinite(m.decibels) && m.decibels >= 0;
  if (!complete || !ISO.test(m.horodatage)) {
    throw new MesureBruitInvalide(
      "capteur, décibels (positif) et horodatage ISO requis");
  }
  return Object.freeze({ ...m });
}

export function alerteBruit(a: Omit<AlerteBruit, "identifiant">): AlerteBruit {
  const identifiant = `${a.capteur}:bruit:${a.heure}`;
  return Object.freeze({ ...a, identifiant });
}

/** "2026-11-18T22:15:00" -> "2026-11-18T22" */
export const heureDe = (h: string) => h.slice(0, 13);