# TP 1 — Trois avantages de l'hexagone, prouvés

Service étudié : Qualité de l'air (UrbanHub).
Les chemins ci-dessous partent du dossier du code du cours (celui qui contient `package.json`).

## Avantage 1 — La logique métier se teste seule

Preuve : `test/surveillance.test.ts`, lignes 14 à 16

    const alertesEspionnes = { publier: async (a: Alerte) => { publiees.push(a); } };
    const service = new SurveillanceQualiteAir(new DepotMesuresEnMemoire(),
      alertesEspionnes, new SeuilMoyenneJournaliere("PM10", 50));

Le service est créé avec un dépôt en mémoire et un faux publicateur qui garde les alertes dans un tableau. Pas de SQLite, pas de HTTP, et pourtant je teste la vraie règle du seuil à 50.

Prix : il faut écrire un adaptateur de test pour chaque port secondaire.

## Avantage 2 — La technique se remplace

Preuve : `test/contratDepot.test.ts`, lignes 12 à 15

    const adaptateurs: Record<string, () => DepotMesures> = {
      memoire: () => new DepotMesuresEnMemoire(),
      sqlite: () => new DepotMesuresSqlite(join(mkdtempSync(join(tmpdir(), "air-")), "m.db")),
    };

La mémoire et SQLite passent le même test, écrit une seule fois. Les deux respectent le port `DepotMesures`, donc je peux passer de l'un à l'autre sans toucher au service.

Prix : il faut concevoir le port avant de coder, ce qui prend du temps au départ.

## Avantage 3 — Toutes les entrées se valent

Preuve : `urbanhub-air/src/adaptateurs/entreeHttp.ts`, ligne 15

    await cas.executer(mesure(JSON.parse(await lireCorps(requete))));

et `urbanhub-air/src/adaptateurs/entreeCsv.ts`, lignes 10-11

    await enregistrerMesure.executer(mesure({ capteur, polluant,
      valeur: Number(valeur), horodatage }));

HTTP et CSV appellent la même méthode `executer` du même cas d'utilisation. Seule la traduction change : du JSON d'un côté, une ligne CSV de l'autre.

Prix : plus de fichiers, et plus de détours par des interfaces.

## Pourquoi ça marche

`urbanhub-air/src/service.ts`, lignes 7 et 12 : le service ne reçoit que des ports (`DepotMesures`, `PublicateurAlertes`, `Regle`), jamais une base ou un réseau. C'est la règle de dépendance : tout pointe vers le centre.