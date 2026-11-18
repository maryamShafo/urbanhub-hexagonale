# TP 3 — Étape 5 : la stratégie de déploiement

Avec les microservices, je choisis la stratégie service par service. Le critère qui décide : est-ce que le service garde des données sur place (un fichier, la mémoire) ?

## La stratégie de chaque service

| Service | Où sont ses données aujourd'hui | Stratégie aujourd'hui | Pourquoi |
|---|---|---|---|
| Bruit | Un fichier `bruit.json` | Recréation, 1 copie | Avec 2 copies, chacune aurait son fichier : la moyenne de l'heure serait fausse. |
| Qualité de l'air | Un fichier SQLite `mesures.db` | Recréation, 1 copie | Même raison : une base dans un fichier ne se partage pas entre copies. |
| Alertes | En mémoire (les alertes déjà traitées) | Recréation, 1 copie | Avec 2 copies, chacune aurait sa liste : une alerte pourrait partir deux fois. |
| Passerelle et backend principal | Aucune | Mise à jour progressive, 2 copies | Ils ne gardent rien : on remplace les copies une à une, sans coupure. |

**Le prix de la Recréation** : une courte interruption à chaque livraison. Je l'accepte aujourd'hui, et le réessai des publicateurs absorbe une coupure courte d'Alertes.

## La cible

Dès que Bruit a un adaptateur vers une base partagée (par exemple PostgreSQL, derrière le même port `DepotMesuresBruit`), je passe à la **mise à jour progressive** avec 2 copies : `replicas: 2` et `strategy: { type: RollingUpdate }`, comme dans le manifeste du cours `k8s/qualite-air.yaml`. Le service, la règle et le domaine ne changent pas : seuls l'adaptateur et la racine de composition changent, comme au TP 2.

Pour un changement de règle (par exemple de nouveaux seuils), je ferais un **canari** : la nouvelle version d'abord pour quelques capteurs, puis pour tous si les alertes sont correctes.

## Le manifeste

`k8s/tp3-etape5-bruit.yaml` décrit l'état voulu du service Bruit :

- **Deployment** : l'image `urbanhub/bruit:1.0.0`, 1 copie, la stratégie Recreate, la configuration par variables d'environnement.
- **PersistentVolumeClaim** : le volume `/donnees`, pour que `bruit.json` survive au remplacement du conteneur.
- **Service** : l'adresse stable `http://bruit:8003`, que le backend principal appelle.
- Deux sondes : Kubernetes n'envoie des requêtes que si le port 8003 répond, et relance le conteneur s'il ne répond plus.

On l'applique avec `kubectl apply -f k8s/`.