# TP 3 — Étape 1 : les contextes délimités d'UrbanHub

Un contexte délimité est une partie du métier où chaque mot a un seul sens.

| Contexte | Ce qu'il fait | Ses mots | Ses données |
|---|---|---|---|
| Qualité de l'air | Reçoit les mesures de polluants et repère les dépassements | Mesure = capteur, polluant, valeur, date. Moyenne par jour. Seuil PM10 : 50 | `mesures.db` (les mesures de pollution) |
| Bruit | Reçoit les mesures de bruit et repère les dépassements | Mesure = capteur, décibels, date. Moyenne par heure. Seuil jour/nuit : 65/55 dB | `bruit.json` (les mesures de bruit) |
| Alertes | Reçoit les alertes et prévient les opérateurs, une seule fois par alerte | Alerte = identifiant, capteur, moyenne, seuil. Opérateur | Les alertes déjà traitées (en mémoire aujourd'hui, une table en production) |

## Pourquoi trois contextes

- Le mot « mesure » n'a pas le même sens dans Qualité de l'air et dans Bruit : polluant et jour d'un côté, décibels et heure de l'autre.
- Alertes ne connaît pas les mesures : il ne voit que des alertes déjà calculées.
- Aucun contexte ne lit les données d'un autre : ils se parlent seulement par HTTP.