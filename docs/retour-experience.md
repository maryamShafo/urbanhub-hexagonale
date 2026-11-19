# Retour d'expérience — UrbanHub, TP 2 à 4

## 1. Ce que j'ai construit

**Le besoin.** UrbanHub surveille la ville avec des capteurs. J'ai ajouté le service **Bruit** : un capteur déclenche une alerte quand la moyenne de ses mesures sur une heure dépasse 65 dB le jour (6 h - 22 h) ou 55 dB la nuit (22 h - 6 h). Près d'un hôpital ou d'une école, le seuil est de 50 dB, jour et nuit.

**Le découpage.** Deux microservices, chacun dans son contexte délimité, chacun en hexagone :
- **Bruit** (`urbanhub-bruit/`) : il reçoit les mesures, applique la règle et publie l'alerte. Sa base : `bruit.json`.
- **Notifications** (`urbanhub-notifications/`) : il reçoit l'alerte et prévient les riverains, une seule fois par alerte. Ses données : la liste des alertes déjà traitées.

Chaque service a son domaine, ses ports et ses adaptateurs, et sa racine de composition (`principal.ts`), le seul fichier qui branche tout.

**Les patrons.**
- **Stratégie** (`regles.ts`) : la règle d'alerte est interchangeable (jour/nuit, zone sensible), sans toucher au service.
- **Décorateur** : le réessai borné (`reessai.ts`) et le coupe-circuit (`coupeCircuit.ts`) enveloppent l'envoi des alertes.
- **Dépôt** : le port `DepotMesuresBruit`, avec trois adaptateurs (mémoire, SQLite, JSON).
- **Consommateur idempotent** : Notifications reconnaît une alerte déjà reçue grâce à son identifiant (`capteur:bruit:heure`).

**La communication.** Bruit publie l'alerte de deux façons, derrière le même port :
- en **HTTP**, avec un délai de 2 s ;
- par **Kafka** (un journal), dans le topic `alertes-bruit` : 3 partitions, le capteur comme clé, deux groupes de lecteurs (`notifications` et `historique`).

## 2. Ce que ça a apporté, et ce que ça a coûté

### Les bénéfices, chacun avec sa preuve

| Bénéfice | La preuve |
|---|---|
| La règle se teste seule, sans base ni réseau | `test/bruitSurveillance.test.ts` : un dépôt en mémoire et un faux publicateur. |
| Changer de base ne touche que 2 fichiers | Commit `73da6f5` (TP 2) : SQLite remplacé par JSON, seulement l'adaptateur et la racine de composition. Le même test de contrat passe sur les trois (`test/bruitContratDepot.test.ts`). |
| Une nouvelle règle ne touche pas le service | `test/bruitRegles.test.ts` : la même mesure de 60 dB donne une alerte avec la règle zone sensible, et aucune avec la règle jour/nuit. |
| Kafka ajouté sans toucher au cas d'utilisation | `service.ts` n'a pas changé : Kafka et HTTP sont deux adaptateurs du même port. |
| Une panne de Notifications ne bloque plus Bruit | `docs/tp4-trace-2-panne-curl.txt` : sans coupe-circuit, une mesure attendait 7,5 s ; une fois le circuit ouvert, elle est refusée en 0,005 s. |
| Aucune alerte perdue par Kafka pendant la panne | `docs/tp4-trace-2-panne.txt` : Bruit répond 202 en 0,014 s, et Notifications rattrape l'alerte à son redémarrage. |
| Aucun doublon, même au rejeu | `docs/tp4-trace-3-rejeu.txt` : le groupe relit les offsets 0 et 1, sans aucune notification en double. |

### Les contraintes, chacune avec ce qu'elle a coûté

| Contrainte | Ce qu'elle a coûté |
|---|---|
| Plus de fichiers et d'interfaces | Un port, un adaptateur et un test pour chaque technique. Le service Bruit seul compte une dizaine de fichiers. |
| Le réseau peut échouer | Il a fallu écrire un délai, un réessai, un coupe-circuit et l'idempotence : quatre parades, chacune avec ses tests. |
| En HTTP, les alertes sont perdues pendant une panne | Les alertes de `bruit-5` à 01 h, 02 h et 03 h ne sont jamais arrivées. Seul Kafka les garde. |
| L'état en mémoire ne survit pas au redémarrage | Sans le fichier des alertes traitées, le rejeu aurait renvoyé toutes les anciennes notifications. Il a fallu un adaptateur de plus. |
| L'exploitation est plus lourde | Cinq conteneurs à lancer (Kafka, deux groupes, deux Bruit), et des erreurs au démarrage (topic absent, Kafka pas prêt) avant que tout fonctionne. |
| Les outils évoluent | `kafkajs` n'est plus mis à jour : j'ai dû prendre Kafka 3.9 au lieu de 4.0. |

## 3. La comparaison avec Segment, et mes recommandations

**Ce qu'a vécu Segment (2018).** Segment envoyait des événements vers plus de 140 destinations, avec un service et une file par destination. Les bibliothèques n'avaient plus les mêmes versions d'un service à l'autre, et trois ingénieurs passaient leur temps à faire tourner le système. Ils sont revenus à un seul service et un seul dépôt, et ils ont perdu l'isolement des pannes.

**Ce que je retrouve dans mon travail, à petite échelle.** Avec seulement deux services, j'ai déjà dû gérer cinq conteneurs, un journal Kafka, des erreurs de démarrage et quatre parades contre les pannes réseau. Le coût d'exploitation grandit avec chaque service, comme chez Segment. Mais j'ai aussi vu ce que Segment a perdu en revenant en arrière : chez moi, quand Notifications tombe, Bruit continue de recevoir les mesures.

**Mes trois recommandations pour un futur projet UrbanHub**

1. **Commencer en monolithe hexagonal, et découper seulement quand un signal apparaît** : une charge très différente entre services, une panne qui doit rester contenue, ou des livraisons qui ne vont plus au même rythme. Les hexagones déjà séparés permettent de découper plus tard sans réécrire le métier.
2. **Prévoir dès le départ les quatre parades sur chaque appel réseau** : un délai, un réessai borné, un coupe-circuit et un consommateur idempotent, avec un identifiant tiré de la donnée (ici, `capteur:bruit:heure`).
3. **Ne garder aucun état important en mémoire, et passer par un journal pour les alertes** : la liste des alertes traitées doit être dans une table, et les alertes dans un journal comme Kafka (ou une boîte d'envoi), pour qu'aucune ne se perde pendant une panne.