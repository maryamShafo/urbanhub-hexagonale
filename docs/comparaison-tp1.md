# TP 1 — Comparaison avec le service Alertes

Alertes (`urbanhub-alertes/`) reçoit les alertes de Qualité de l'air et prévient les opérateurs une seule fois par alerte, même si elle arrive deux fois.

## Réponse

Il lui manque l'avantage **« la technique se remplace »**, et il le mérite.

## Faut-il l'hexagone ?

- **Une règle métier ?** Oui : une alerte déjà reçue ne doit pas prévenir deux fois.
- **Plusieurs entrées ou sorties ?** Une entrée (HTTP), deux sorties (les opérateurs et la liste des alertes traitées).
- **Une technique qui va changer ?** Oui : la mémoire aujourd'hui, une table en production.

Trois oui : l'hexagone vaut son prix ici.

## Avantage par avantage

| Avantage | Présent ? | Preuve |
|---|---|---|
| Logique testée seule | Oui | `test/alertesIdempotent.test.ts` l.7 : un faux opérateur, sans réseau |
| Technique remplaçable | **Non** | `urbanhub-alertes/src/service.ts` l.12 : `new Set<string>()` en mémoire, sans port |
| Entrées équivalentes | En partie | Une seule entrée HTTP, et `JSON.parse` non protégé (`entreeHttp.ts` l.9) |

## Est-ce qu'il le mérite ?

**Technique remplaçable : oui.** Le code dit lui-même « en production : une table ». Aujourd'hui, au redémarrage, la mémoire est vidée et une alerte peut repartir deux fois. Je mettrais un port `AlertesTraitees`, avec un adaptateur mémoire pour les tests et un adaptateur base pour la production.
Prix : un port et un adaptateur de plus.

**Entrées équivalentes : pas encore.** Une seule entrée suffit pour l'instant. Si un bus de messages arrive, ce sera juste un adaptateur de plus, parce que la logique est déjà dans `ReceptionAlertes`.
Prix : un fichier de plus par entrée.

## Ce que je retiens

Alertes est déjà à moitié en hexagone : ses opérateurs passent par un port, donc il se teste seul. Mais son stockage n'en a pas, alors que c'est justement la partie qui va changer en production. C'est là que l'hexagone serait le plus utile.