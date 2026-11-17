# TP 1 — Trois avantages de l'hexagone, prouvés

Service étudié : Qualité de l'air (UrbanHub).
Les chemins partent du dossier du code du cours (celui qui contient `package.json`).
Pour « l'effet chez nous », je compare avec le service Alertes (détails dans `comparaison-tp1.md`).

---

## Avantage 1 — La logique métier se teste seule

**Extrait** : `test/surveillance.test.ts`, lignes 14 à 16

    const alertesEspionnes = { publier: async (a: Alerte) => { publiees.push(a); } };
    const service = new SurveillanceQualiteAir(new DepotMesuresEnMemoire(),
      alertesEspionnes, new SeuilMoyenneJournaliere("PM10", 50));

Le service reçoit un dépôt en mémoire et un faux publicateur. Il n'y a ni base ni réseau, mais c'est bien la vraie règle du seuil à 50 qui est testée.

**Expérience** : j'ai ajouté `test/experience1SansBase.test.ts`, avec deux nouveaux tests de la règle : les mesures de la veille ne comptent pas, et une moyenne de 50 pile ne déclenche rien.
- Ce qui a changé : un fichier de test en plus.
- Ce qui n'a pas bougé : `service.ts`, `regles.ts`, `domaine.ts`. Aucune base à lancer.
- Résultat : mes tests tournent en 2 ms et 0,3 ms. Le test « avant l'hexagone », lui, a besoin d'une base sur disque et d'un faux serveur, et met environ 100 ms.

**Prix** : un adaptateur de test à écrire pour chaque port secondaire. Et je répète la création du faux publicateur dans chaque test.

**Effet chez nous** : Alertes a déjà cet avantage. Son test (`test/alertesIdempotent.test.ts`, ligne 7) utilise un faux opérateur, sans réseau.

---

## Avantage 2 — La technique se remplace

**Extrait** : `test/contratDepot.test.ts`, lignes 12 à 15 (code d'origine)

    const adaptateurs: Record<string, () => DepotMesures> = {
      memoire: () => new DepotMesuresEnMemoire(),
      sqlite: () => new DepotMesuresSqlite(join(mkdtempSync(join(tmpdir(), "air-")), "m.db")),
    };

La mémoire et SQLite passent le même test, écrit une seule fois, parce qu'ils respectent le même port, `DepotMesures`.

**Expérience** : j'ai écrit un troisième adaptateur, `urbanhub-air/src/adaptateurs/depotJson.ts`, qui range les mesures dans un fichier JSON, et je l'ai ajouté au test de contrat.
- Ce qui a changé : un nouveau fichier (environ 25 lignes) et 2 lignes dans `contratDepot.test.ts`.
- Ce qui n'a pas bougé : le service, la règle et le port. Le même test passe pour la mémoire, SQLite et JSON.

**Prix** : il faut concevoir le port avant de coder, ce qui prend du temps au départ. Mon adaptateur JSON relit tout le fichier à chaque appel : ça marche pour l'expérience, mais ce serait lent avec beaucoup de mesures.

**Effet chez nous** : c'est l'avantage qui manque à Alertes. La liste des alertes déjà traitées est un `Set` en mémoire, écrit directement dans le service (`urbanhub-alertes/src/service.ts`, ligne 12), alors que le code dit « en production : une table ». Il le mérite : un port `AlertesTraitees` permettrait de passer à une table sans toucher au service.

---

## Avantage 3 — Toutes les entrées se valent

**Extrait** : `urbanhub-air/src/adaptateurs/entreeHttp.ts`, ligne 15

    await cas.executer(mesure(JSON.parse(await lireCorps(requete))));

et `urbanhub-air/src/adaptateurs/entreeCsv.ts`, lignes 10 et 11

    await enregistrerMesure.executer(mesure({ capteur, polluant,
      valeur: Number(valeur), horodatage }));

HTTP et CSV appellent la même méthode `executer` du même cas d'utilisation. Seule la traduction change.

**Expérience** : j'ai ajouté une troisième entrée, la ligne de commande (`urbanhub-air/src/adaptateurs/entreeLigneCommande.ts`), avec son test `test/entreeLigneCommande.test.ts`.
- Ce qui a changé : deux fichiers, l'adaptateur (environ 10 lignes) et son test.
- Ce qui n'a pas bougé : le cas d'utilisation. La ligne de commande donne la même alerte, de moyenne 55, que HTTP et CSV.

**Prix** : plus de fichiers, et plus de détours par des interfaces : un adaptateur de plus pour chaque nouvelle entrée. Pour suivre le trajet d'une mesure, il faut passer par l'interface du port.

**Effet chez nous** : Alertes ne l'a qu'en partie. Il n'a qu'une entrée, HTTP, et son `JSON.parse` n'est pas protégé (`urbanhub-alertes/src/entreeHttp.ts`, ligne 9). Ce n'est pas encore nécessaire, mais si un bus de messages arrive, ce sera juste un adaptateur de plus, puisque la logique est déjà dans `ReceptionAlertes`.

---

## Conclusion

Les trois avantages tiennent pour une même raison : le service ne reçoit que des ports, jamais une base ou un réseau (`urbanhub-air/src/service.ts`, lignes 7 et 12). Le prix, c'est plus de fichiers et du temps au départ. Pour un service qui a une vraie règle métier, comme Qualité de l'air ou Alertes, ça vaut le coup.