# EADL FM03 — Architecture hexagonale

Maryam — IMIE Paris

## TP 1 — Trois avantages de l'hexagone, prouvés

- Lien de dépôt : https://github.com/maryamShafo/urbanhub-hexagonale
- Empreinte du commit : 268f3d2
- Chemin du rapport : docs/rapport-final-tp1.md


**Documents**

| Fichier | Résumé |
|---|---|
| `docs/rapport-tp1.md` | Étape 2 : les trois avantages choisis et les lignes de code qui les prouvent. |
| `docs/comparaison-tp1.md` | Étape 4 : comparaison avec le service Alertes ; il lui manque « la technique se remplace », et il le mérite. |
| `docs/rapport-final-tp1.md` | Étape 5 : le rapport complet, un avantage par section (extrait, expérience, prix, effet chez nous). |


## TP 2 — Un service UrbanHub en hexagone, avec deux patrons

### Le service : Bruit

**Règle de gestion** : un capteur de bruit déclenche une alerte quand la moyenne de ses mesures sur une heure dépasse 65 dB le jour (de 6 h à 22 h) ou 55 dB la nuit (de 22 h à 6 h). Près d'un hôpital ou d'une école, le seuil est de 50 dB, jour et nuit.

Code : `urbanhub-bruit/`, en TypeScript. Tests : `test/bruit*.test.ts`.

### Le schéma

```
                 ENTRÉE (adaptateur primaire)
                 entreeHttp.ts : POST /mesures-bruit
                            |
                            v
              port primaire EnregistrerMesureBruit
   +-----------------------------------------------------+
   |  CENTRE (aucun import technique)                    |
   |  domaine.ts   : MesureBruit, AlerteBruit            |
   |  service.ts   : SurveillanceBruit (cas d'utilisation)|
   |  regles.ts    : RegleBruit (Stratégie)              |
   |                 SeuilJourNuit, SeuilZoneSensible    |
   +-----------------------------------------------------+
            |                                |
   port DepotMesuresBruit          port PublicateurAlertesBruit
            |                                |
            v                                v
   depotMemoire.ts (tests)        PublicateurBruitAvecReessai (Décorateur)
   depotSqlite.ts                            |
   depotJson.ts (production)                 v
                                   publicationHttp.ts -> service Alertes

   principal.ts (racine de composition) : le seul fichier qui branche tout
```

Toutes les dépendances pointent vers le centre. Le test `test/bruitRegleDependance.test.ts` le vérifie.

### Patron 1 : Stratégie (`urbanhub-bruit/src/regles.ts`)

- **Le problème** : tous les lieux n'ont pas la même règle. Une rue suit le seuil jour/nuit, mais une zone sensible (hôpital, école) a un seuil plus bas. Sans Stratégie, il faudrait ajouter un `if` dans le service pour chaque nouveau lieu.
- **Maintenabilité** : une nouvelle règle s'ajoute sans toucher au service. Preuve : `test/bruitRegles.test.ts`, où le même service et la même mesure de 60 dB donnent une alerte ou non selon la règle.
- **Scalabilité** : pas d'effet direct sur la charge.
- **Ce qu'il coûte** : une classe par règle, même minuscule.

### Patron 2 : Décorateur (`urbanhub-bruit/src/adaptateurs/reessai.ts`)

- **Le problème** : le service Alertes peut être coupé un instant (redémarrage, réseau). Sans réessai, l'alerte bruit est perdue.
- **Maintenabilité** : le réessai s'ajoute ou se retire dans la racine de composition (`principal.ts`), sans modifier ni le service ni le publicateur HTTP.
- **Scalabilité** : un autre service coupé un instant ne fait pas échouer l'envoi. Preuve : `test/bruitReessai.test.ts`, où 2 pannes passent et une panne durable remonte.
- **Ce qu'il coûte** : une pile de décorateurs rend un bug plus dur à repérer, et chaque réessai ajoute de l'attente.

### Le remplacement d'un adaptateur

- Commit : `73da6f5`. Il remplace le dépôt SQLite par un dépôt JSON, derrière le même port `DepotMesuresBruit`.
- Il ne touche que 2 fichiers : `urbanhub-bruit/src/adaptateurs/depotJson.ts` et `urbanhub-bruit/src/principal.ts`.
- Le service, la règle et le domaine n'ont pas bougé. Le même test de contrat passe sur la mémoire, SQLite et JSON (`test/bruitContratDepot.test.ts`).

### Lancer

    npm test          # tous les tests
    npm run alertes   # le service Alertes, port 8002
    npm run bruit     # le service Bruit, port 8003