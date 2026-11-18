# TP 3 — Étape 6 : la conclusion

## Lequel aujourd'hui : le monolithe hexagonal

Aujourd'hui, je garde UrbanHub en un seul programme, avec ses trois hexagones séparés (Qualité de l'air, Bruit, Alertes).

- **Les microservices ne nous apportent pas encore leur avantage principal.** Chaque service garde ses données dans un fichier ou en mémoire : aucun ne peut avoir plusieurs copies (étape 5). On paierait le réseau sans pouvoir dupliquer un seul service.
- **Le monolithe est plus simple et plus sûr.** Un appel de fonction au lieu d'un appel réseau, une seule base où la mesure et l'alerte s'écrivent ensemble, un seul programme à livrer.
- **On ne ferme aucune porte.** Les hexagones sont déjà séparés, chacun avec ses ports. Passer aux microservices, c'est changer les adaptateurs et la racine de composition, pas réécrire la logique.
- **Le cours le confirme par deux retours d'expérience.** Segment est revenu de plus de 140 microservices à un seul service, et Prime Video a réduit de 90 % son coût d'infrastructure en revenant à un seul processus.

## Les trois critères (C5)

| Critère | Monolithe hexagonal | Microservices |
|---|---|---|
| **Performance** | Plus rapide : un appel de fonction, sans réseau. Mais on duplique tout le programme pour tenir la charge. | Chaque appel passe par le réseau, donc plus lent. Mais on peut dupliquer seulement le service qui chauffe. |
| **Sécurité** | Un seul programme exposé, une seule porte à protéger. | Plus de portes : chaque service est sur le réseau. Il faut une passerelle qui authentifie, et sécuriser les appels entre services. |
| **Interopérabilité** | Tout est en TypeScript, dans le même programme. | Les services se parlent en HTTP et en JSON : un nouveau service pourrait être écrit dans un autre langage (Python, Java). |

## À quel signal je changerais d'avis

Je découperais en microservices si l'un de ces signaux apparaît :

1. **Un service doit tenir beaucoup plus de charge que les autres.** Par exemple, si la ville installe beaucoup de capteurs de bruit qui envoient des mesures en continu, je sortirais Bruit pour le dupliquer seul, après lui avoir donné un adaptateur vers une base partagée.
2. **Une panne doit rester contenue.** Si une panne d'Alertes ne doit jamais empêcher de recevoir les mesures, il faut des processus séparés.
3. **Les livraisons ne vont plus au même rythme.** Si les seuils du bruit changent chaque semaine et que l'air ne change jamais, livrer tout le programme à chaque fois deviendrait gênant.
4. **Plusieurs équipes travaillent sur UrbanHub.** Si une équipe s'occupe du bruit et une autre de l'air, chacune doit pouvoir livrer sans attendre l'autre.

Pour décider, je regarderais les métriques de l'étape 4 : le nombre de mesures par seconde, le temps de réponse et les erreurs de chaque service.