# Plan du dossier d'architecture — EC01

## 1. Ce que mes TP prouvent déjà dans la grille EC01

### C4.1 — Adéquation aux besoins et contraintes du projet

| Ce que j'ai fait | Où le trouver |
|---|---|
| Le besoin écrit en une règle de gestion (bruit, jour/nuit, zone sensible) | `README.md`, partie TP 2 |
| Un découpage par contexte délimité, pas par table | `docs/tp3-contextes.md` ; deux services, Bruit et Notifications (TP 4) |
| Le choix monolithe ou microservices argumenté, avec les signaux pour changer d'avis | `docs/tp3-comparatif.md`, `docs/tp3-etape6-conclusion.md` |
| Une stratégie de déploiement adaptée aux données de chaque service (1 copie tant que les données sont dans un fichier) | `docs/tp3-etape5-deploiement.md`, `k8s/tp3-etape5-bruit.yaml` |
| Un manque repéré dans un service existant, puis corrigé | `docs/comparaison-tp1.md` (Alertes n'a pas de port pour ses alertes traitées) ; le port `AlertesTraitees` dans Notifications (TP 4) |

### C5.1 — Argumentation technique (performance, sécurité, maintenabilité)

| Critère | Ce que j'ai fait | La preuve |
|---|---|---|
| Performance | Le coupe-circuit : une mesure passe de 7,5 s d'attente à 0,005 s quand Notifications est en panne | `docs/tp4-trace-2-panne-curl.txt`, `test/bruitCoupeCircuit.test.ts` |
| Performance | Kafka : Bruit répond en 0,014 s pendant la panne, au lieu d'attendre | `docs/tp4-trace-2-panne-curl.txt` |
| Fiabilité | Aucune alerte perdue par Kafka, aucun doublon au rejeu | `docs/tp4-trace-2-panne.txt`, `docs/tp4-trace-3-rejeu.txt`, `test/notificationsIdempotent.test.ts` |
| Sécurité | Les données venues du réseau sont vérifiées (422 si mal formées) ; requêtes SQL avec paramètres, jamais de concaténation | `test/bruitEntreeHttp.test.ts`, `urbanhub-bruit/src/adaptateurs/depotSqlite.ts` |
| Sécurité | Une passerelle d'API comme seul point d'entrée, qui authentifie | `docs/tp3-vue-ensemble.md` (proposée, pas codée) |
| Maintenabilité | Le centre n'importe aucune technique, et un test le vérifie | `test/bruitRegleDependance.test.ts`, `test/notificationsRegleDependance.test.ts` |
| Maintenabilité | Changer de base ne touche que 2 fichiers | commit `73da6f5`, `test/bruitContratDepot.test.ts` |

## 2. Le plan du dossier

Pour chaque partie : le choix, sa raison, son prix, et une preuve.

### 2.1 Le besoin
- **Choix** : surveiller le bruit, avec une règle jour/nuit et une règle zone sensible.
- **Raison** : les riverains doivent être prévenus, et la nuit le bruit gêne plus.
- **Prix** : deux règles à maintenir.
- **Preuve** : `test/bruitRegles.test.ts`.

### 2.2 L'architecture : l'hexagone
- **Choix** : le métier au centre, la technique autour, toutes les dépendances vers le centre.
- **Raison** : tester la règle sans base, et changer de technique sans toucher au métier.
- **Prix** : plus de fichiers et d'interfaces (un port, un adaptateur et un test par technique).
- **Preuve** : `test/bruitRegleDependance.test.ts`, commit `73da6f5`.

### 2.3 Le découpage
- **Choix** : deux contextes délimités, Bruit et Notifications, chacun avec ses données.
- **Raison** : leurs mots n'ont pas le même sens (une mesure d'un côté, une notification aux riverains de l'autre), et une panne de l'un ne doit pas arrêter l'autre.
- **Prix** : des appels réseau qui peuvent échouer, et des données réparties.
- **Preuve** : `docs/tp3-contextes.md`, `docs/tp4-trace-2-panne.txt`.
- **Nuance** : pour UrbanHub aujourd'hui, je recommande de commencer en monolithe hexagonal (`docs/tp3-etape6-conclusion.md`).

### 2.4 Les patrons
| Patron | Le problème réel | Le prix | La preuve |
|---|---|---|---|
| Stratégie | Une règle différente selon le lieu | Une classe par règle | `test/bruitRegles.test.ts` |
| Décorateur (réessai) | Une coupure courte fait perdre l'alerte | De l'attente à chaque essai | `test/bruitReessai.test.ts` |
| Décorateur (coupe-circuit) | Une panne longue fait attendre chaque mesure 7,5 s | Des alertes refusées pendant 30 s | `test/bruitCoupeCircuit.test.ts` |
| Dépôt | Changer de base sans toucher au service | Un adaptateur par base | `test/bruitContratDepot.test.ts` |
| Consommateur idempotent | Le réessai et le rejeu livrent deux fois | Garder la liste des alertes traitées | `test/notificationsIdempotent.test.ts` |
| Racine de composition | Brancher les adaptateurs à un seul endroit | Un fichier de plus par service | `urbanhub-bruit/src/principal.ts` |

### 2.5 La communication
- **Choix** : HTTP avec un délai de 2 s, et Kafka (topic de 3 partitions, le capteur comme clé, deux groupes).
- **Raison** : en HTTP, l'alerte est perdue pendant une panne ; Kafka la garde et permet de la relire.
- **Prix** : un journal à faire tourner, et l'idempotence obligatoire.
- **Preuve** : `docs/tp4-trace-2-panne.txt`, `docs/tp4-trace-3-rejeu.txt`.

### 2.6 Le déploiement
- **Choix** : une image par service, Kubernetes, stratégie Recréation avec 1 copie tant que les données sont dans un fichier.
- **Raison** : deux copies auraient chacune leur fichier, et la moyenne serait fausse.
- **Prix** : une courte interruption à chaque livraison.
- **Preuve** : `k8s/tp3-etape5-bruit.yaml`, `docs/tp3-etape5-deploiement.md`, `compose-bruit.yaml`.
- **Cible** : avec une base partagée, mise à jour progressive à 2 copies, et canari pour les changements de règle.