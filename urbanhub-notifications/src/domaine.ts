// ===========================================================
// LE DOMAINE du service Notifications (contexte délimité à part)
// Son métier : prévenir les riverains quand le bruit est trop fort.
// Ses mots à lui : une « alerte reçue » devient une « notification ».
// Aucun import technique ici.
// ===========================================================
export class AlerteInvalide extends Error {}

/** Ce que ce service reçoit : l'alerte, telle que Bruit l'envoie (en JSON). */
export type AlerteRecue = Readonly<{ identifiant: string; capteur: string;
  heure: string; moyenne: number; seuil: number }>;

/** Ce que ce service produit : un message pour les riverains. */
export type Notification = Readonly<{ identifiant: string; capteur: string; message: string }>;

/** Vérifie l'alerte reçue : tout ce qui vient du réseau peut être mal formé. */
export function alerteRecue(a: AlerteRecue): AlerteRecue {
  const complete = a && a.identifiant && a.capteur && a.heure
    && Number.isFinite(a.moyenne) && Number.isFinite(a.seuil);
  if (!complete) {
    throw new AlerteInvalide("identifiant, capteur, heure, moyenne et seuil requis");
  }
  return Object.freeze({ ...a });
}

/** Traduit l'alerte dans les mots de ce contexte : une notification aux riverains. */
export function notificationDe(a: AlerteRecue): Notification {
  const heure = a.heure.slice(11, 13);                      // "2026-11-18T23" -> "23"
  return Object.freeze({ identifiant: a.identifiant, capteur: a.capteur,
    message: `Bruit trop fort près de ${a.capteur} vers ${heure} h : `
      + `${a.moyenne} dB pour un seuil de ${a.seuil} dB` });
}