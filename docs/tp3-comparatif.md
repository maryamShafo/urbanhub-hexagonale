# TP 3 — Étape 3 : monolithe ou microservices, ce que chaque choix coûte

Je reprends le tableau du cours (3.2, « Monolithe ou microservices : ce que chaque choix coûte ») avec ses cinq lignes, appliqué à mes deux dessins de l'étape 2.

| | Monolithe hexagonal | Microservices |
|---|---|---|
| **Appels** | Qualité de l'air et Bruit préviennent Alertes par un appel de fonction : rapide, sans panne réseau. | Ils préviennent Alertes par HTTP (`POST /alertes`) : plus lent, et ça peut échouer. Il faut un délai maximum (2 s dans `publicationHttp.ts`), un réessai (le Décorateur) et l'idempotence : Alertes repère les doublons grâce à l'identifiant de l'alerte. |
| **Transactions** | Une seule base : la mesure et l'alerte s'écrivent ensemble, ou pas du tout. | Trois bases : la mesure est dans `mesures.db` ou `bruit.json`, l'alerte traitée est chez Alertes. Si l'envoi échoue après l'enregistrement de la mesure, les données ne sont plus d'accord : la cohérence devient un souci de conception. |
| **Déploiement** | Un seul programme à livrer : simple, mais tout repart à chaque livraison. Changer le seuil du bruit redémarre aussi l'air et les alertes. | Chaque service se livre seul : je peux livrer Bruit sans toucher à Qualité de l'air ni à Alertes. |
| **Montée en charge** | On duplique tout le programme, même les parties peu sollicitées. | On duplique seulement le service qui reçoit le plus de demandes, par exemple Bruit si ses capteurs envoient beaucoup de mesures. Attention : avec plusieurs copies, Bruit ne peut plus garder un fichier `bruit.json` local. Il faut un adaptateur vers une base partagée. |
| **Panne** | Une panne emporte tout : un défaut dans Alertes peut arrêter la réception des mesures. | La panne reste contenue : si Alertes tombe, Qualité de l'air et Bruit continuent de recevoir les mesures, à condition d'avoir prévu le délai et le réessai. |

## Ce que j'en retiens

Le monolithe est plus simple et plus sûr pour les données. Les microservices permettent de livrer, dupliquer et contenir les pannes service par service, mais chaque appel passe par le réseau et peut échouer.

Le code métier (les hexagones) est le même dans les deux cas. Je peux donc commencer en monolithe et découper plus tard, sans réécrire la logique.