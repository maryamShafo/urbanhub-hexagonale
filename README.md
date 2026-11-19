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

## TP 3 — Monolithe ou microservices, pour UrbanHub

- Lien : https://github.com/maryamShafo/urbanhub-hexagonale
- Empreinte du commit : bc27302
- Chemin du livrable : docs/ (fichiers tp3-*) et k8s/tp3-etape5-bruit.yaml

### Les livrables

| Livrable | Fichier |
|---|---|
| Les contextes délimités et leurs données | `docs/tp3-contextes.md` |
| Les deux schémas (monolithe et microservices) | `docs/tp3-schemas.md` |
| Le tableau comparatif | `docs/tp3-comparatif.md` |
| La vue d'ensemble et la gestion de chaque service | `docs/tp3-vue-ensemble.md` |
| La stratégie de déploiement | `docs/tp3-etape5-deploiement.md` |
| Le manifeste Kubernetes du service Bruit | `k8s/tp3-etape5-bruit.yaml` |
| La conclusion | `docs/tp3-etape6-conclusion.md` |

### En bref

Aujourd'hui, je garde UrbanHub en monolithe hexagonal : chaque service garde ses données dans un fichier ou en mémoire, donc aucun ne peut encore avoir plusieurs copies. Je passerais aux microservices si un service doit tenir beaucoup plus de charge que les autres, si une panne doit rester contenue, ou si les livraisons ne vont plus au même rythme.    

## TP 4 — Deux microservices hexagonaux qui se parlent

### Les deux services

- **Bruit** (`urbanhub-bruit/`, port 8003) : reçoit les mesures, applique la règle jour/nuit, publie l'alerte. Sa base : `bruit.json`.
- **Notifications** (`urbanhub-notifications/`, port 8004) : un second contexte délimité. Il reçoit l'alerte et prévient les riverains, une seule fois par alerte. Ses ports : `RecevoirAlerte` (primaire), `AlertesTraitees` et `Riverains` (secondaires).

Les deux sont en hexagone, avec leurs tests verts : `npm test`.

### Les deux adaptateurs de publication (même port `PublicateurAlertesBruit`)

| Adaptateur | Fichier | Réglages |
|---|---|---|
| HTTP | `urbanhub-bruit/src/adaptateurs/publicationHttp.ts` | délai de 2 s (`AbortSignal.timeout`) |
| Kafka | `urbanhub-bruit/src/adaptateurs/publicationKafka.ts` | topic `alertes-bruit` de 3 partitions, clé = le capteur, deux groupes (`notifications`, `historique`) |

Autour, deux Décorateurs : le réessai borné (`reessai.ts`, 3 essais) et le coupe-circuit (`coupeCircuit.ts`, ouvert après 5 échecs, 30 s, puis un appel d'essai). Le cas d'utilisation n'a pas changé d'une ligne.

### Les traces

| Trace | Fichier |
|---|---|
| Le scénario, de la mesure à l'alerte reçue | `docs/tp4-trace-1-scenario.txt` |
| La panne de Notifications, en HTTP et par Kafka | `docs/tp4-trace-2-panne.txt`, `docs/tp4-trace-2-panne-curl.txt` |
| Le rejeu du groupe `historique` depuis le début | `docs/tp4-trace-3-rejeu.txt`, `docs/tp4-trace-3-rejeu-offsets.txt` |

Lancer : `docker compose -f compose-bruit.yaml up -d`.

### Les défis rencontrés et leurs solutions

| Défi | Ce que j'ai vu | Solution |
|---|---|---|
| Notifications lent ou coupé | Une mesure attendait **7,5 s** avant d'échouer (3 essais de 2 s + 1,5 s de pauses). | Le **coupe-circuit** : après 5 échecs, les appels sont refusés en **0,005 s**, sans toucher le réseau. |
| Alertes perdues en HTTP pendant la panne | Bruit répondait 500 : les alertes de `bruit-5` à 01 h, 02 h et 03 h ne sont jamais arrivées. | **Kafka** : pendant la même panne, Bruit a répondu 202 en 0,014 s. L'alerte a attendu dans le topic, et Notifications l'a rattrapée à son redémarrage. |
| Doublons (le réessai ou le rejeu livrent deux fois) | Deux mesures dans la même heure, ou un rejeu, envoient la même alerte. | **L'idempotence** : un identifiant tiré de la mesure (`capteur:bruit:heure`). Un doublon n'agit pas (`test/notificationsIdempotent.test.ts`). |
| Le rejeu après un redémarrage | En mémoire, la liste des alertes traitées est perdue au redémarrage : le rejeu aurait tout renvoyé en double. | Un **adaptateur fichier** pour le port `AlertesTraitees`. Au rejeu, le groupe a relu les offsets 0 et 1 **sans aucune notification en double**. En production, ce serait une table. |
| Le topic n'existait pas au démarrage | Les consommateurs plantaient avec `UNKNOWN_TOPIC_OR_PARTITION`. | `restart: on-failure` dans le compose : ils se relancent, et Bruit crée le topic avec 3 partitions. |
| `kafkajs` et Kafka 4.0 | `kafkajs` n'est plus mis à jour, et Kafka 4.0 a retiré d'anciennes versions de son protocole. | J'ai pris **Kafka 3.9** dans le compose. L'avertissement `TimeoutNegativeWarning` de `kafkajs` est sans gravité. |

**Ce qui reste à améliorer** : en HTTP, la mesure est enregistrée même quand l'alerte n'a pas pu partir. Une **boîte d'envoi** (outbox, vue au chapitre 4) garderait l'alerte pour la renvoyer plus tard.

- Lien : https://github.com/maryamShafo/urbanhub-hexagonale
- Empreinte du commit : cc21999
- Chemin du livrable : urbanhub-bruit/ et urbanhub-notifications/ (code), test/ (tests), docs/tp4-trace-*.txt (traces), README.md partie TP 4 (défis et solutions)