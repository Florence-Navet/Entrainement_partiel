# Fiche - Choisir le bon code HTTP

## La méthode : trois questions, dans l'ordre

Pour chaque requête, je pose ces trois questions une après l'autre. Dès qu'une réponse est « non », j'ai mon code.

1. **La demande est-elle bien écrite ?** (l'id est un entier positif, le titre est présent…)
   → Non : **400 Bad Request**
2. **Ce que je cherche existe-t-il ?**
   → Non : **404 Not Found**
3. **Tout va bien : qu'est-ce que j'ai fait ?**
   - j'ai lu → **200 OK**
   - j'ai créé → **201 Created**
   - j'ai supprimé, rien à renvoyer → **204 No Content**

## L'exemple Ecoda

Les défis (« challenges ») de la base :

| id | Défi | Catégorie |
| --- | --- | --- |
| 1 | Se déplacer à vélo | carbone |
| 2 | Repas végétarien | alimentation |
| 3 | Faire du covoiturage | carbone |

| Requête | Ça se lit | Code | Pourquoi |
| --- | --- | --- | --- |
| `GET /challenges` | donne-moi tous les défis | 200 | lecture réussie |
| `GET /challenges/3` | donne-moi le défi n°3 | 200 | il existe |
| `GET /challenges/999` | donne-moi le défi n°999 | 404 | il n'existe pas |
| `GET /challenges/abc` | donne-moi le défi n°abc | 400 | `abc` n'est pas un numéro |
| `GET /challenges/-5` | donne-moi le défi n°-5 | 400 | un id est toujours positif |
| `GET /challenges?category=carbone` | donne-moi les défis carbone | 200 | renvoie les défis 1 et 3 |
| `GET /challenges?category=sport` | donne-moi les défis sport | 200 | liste vide `[]`, pas une erreur |
| `POST /challenges` valide | crée un défi | 201 | création réussie |
| `POST /challenges` sans titre | crée un défi | 400 | il manque une donnée |

## Les pièges à retenir

- **Une liste vide, c'est 200**, pas 404. La question était bonne, il n'y a juste aucun résultat.
- **404**, c'est quand je demande **un** élément précis qui n'existe pas.
- **400**, c'est quand la demande est mal écrite. Je n'ai même pas besoin de chercher en base.
- **405**, c'est quand l'adresse existe mais pas avec ce verbe (`POST` sur une route qui n'accepte que `GET`). Express ne le fait pas tout seul : il répond 404. Symfony le fait. À l'examen, la bonne réponse est 405.
- **500**, c'est toujours la faute du serveur : le code a planté. Ce n'est jamais une réponse normale.

## Le vocabulaire d'une adresse

| Morceau | Exemple | À quoi ça sert |
| --- | --- | --- |
| le verbe | `GET` | ce que je veux faire (lire, créer…) |
| le chemin | `/challenges` | la ressource |
| la case `:id` | `/challenges/3` | un élément précis, lu avec `req.params.id` |
| après le `?` | `?category=carbone` | un filtre, lu avec `req.query.category` |

## Les familles de codes

- **2xx** : c'est bon
- **4xx** : c'est la faute du client
- **5xx** : c'est la faute du serveur