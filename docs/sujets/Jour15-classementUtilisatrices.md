# Jour 15 - Le classement des utilisatrices (Redis, ensemble trié)

- **Objet :** séance mixte : 4 QCU d'échauffement, une **nouvelle structure Redis** (l'ensemble trié), une route dans le projet, et sa documentation.
- **Durée :** 30 min (3 min de QCU + 5 min de lecture + 15 min de code + 7 min de YAML).
- **Modalités :** les QCU se font **sans** les fiches. Pour le code et le YAML, suis le plan, une étape à la fois, et teste après chacune.
- **Projet :** `~/projets/entrainement-partiel`.

---

## Section 0 - Échauffement (3 min - 4 pts)

**Q0.1 (QCU, 1 pt)** Une modification réussie avec `PATCH` répond :

- a) 200, avec l'élément modifié
- b) 201
- c) 204
- d) 409

**Q0.2 (QCU, 1 pt)** Dans `openapi.yaml`, la même adresse a un `delete` et un `patch`. Comment l'écrire ?

- a) deux fois le chemin, un pour chaque verbe
- b) une seule fois le chemin, avec `delete:` et `patch:` dessous, au même niveau
- c) un seul verbe par fichier
- d) `delete-patch:`

**Q0.3 (QCU, 1 pt)** Quelle affirmation est **fausse** ?

- a) `redis.del` supprime une clé
- b) une route qui modifie la liste doit supprimer le cache
- c) le cache se met à jour tout seul quand la liste change
- d) `TTL` = -2 veut dire que la clé n'existe pas

**Q0.4 (QCU, 1 pt)** Après `res.status(404).json(...)` dans un `if`, quel mot arrête la route ?

- a) `stop`
- b) `next()`
- c) `return`
- d) `break`

---

## L'essentiel à retenir (5 min)

### Une nouvelle structure Redis : l'ensemble trié

Jusqu'ici, chaque clé Redis contenait **une seule valeur** (un texte, un compteur). Un **ensemble trié** (*sorted set*) contient **plusieurs membres**, chacun avec un **score**, et Redis les garde **toujours triés** par score.

C'est fait pour un **classement** :

| Membre (l'id de l'utilisatrice) | Score (ses points) |
| --- | --- |
| `"3"` | 90 |
| `"1"` | 30 |
| `"2"` | 10 |

### Les deux commandes

| Je veux… | Commande | Renvoie |
| --- | --- | --- |
| ajouter des points à un membre | `await redis.zincrby("leaderboard", 20, "1")` | le nouveau score, en texte |
| lire le classement, du plus grand au plus petit | `await redis.zrevrange("leaderboard", 0, 2, "WITHSCORES")` | une liste plate |

- **`zincrby(clé, combien, membre)`** : comme `incrby`, mais pour **un membre** de l'ensemble. Si le membre n'existe pas, il est créé.
- **`zrevrange(clé, début, fin, "WITHSCORES")`** : `rev` = du plus grand au plus petit ; `0, 2` = les positions 0 à 2, donc les **3 premiers** ; `"WITHSCORES"` = avec les scores.

### Le piège : la liste plate

`zrevrange` avec `WITHSCORES` renvoie **une seule liste**, où membres et scores **alternent** :

```ts
["3", "90", "1", "30", "2", "10"]
```

Pour fabriquer `[{ userId: "3", points: 90 }, ...]`, on la parcourt **deux par deux** :

```ts
const ranking = [];
for (let i = 0; i < raw.length; i = i + 2) {
  ranking.push({ userId: raw[i], points: Number(raw[i + 1]) });
}
```

- `i = i + 2` : on avance de **deux** cases à chaque tour ;
- `raw[i]` : le membre ; `raw[i + 1]` : son score, en texte → `Number(...)`.

Dans la console Redis : `ZREVRANGE leaderboard 0 -1 WITHSCORES` affiche tout le classement (`-1` = jusqu'au dernier).

---

## Section 1 - Le classement dans le projet (15 min - 12 pts) `[CP8]`

**Le but :**
- chaque validation de défi ajoute les points de l'utilisatrice dans l'ensemble trié `leaderboard` ;
- `GET /leaderboard` (sans jeton) répond **200** avec les **3 premières** : `[{ "userId": "1", "points": 30 }, ...]`.

### Étape 1 - Remplir le classement (3 pts)

Dans ta route `POST /challenges/:id/complete`, **juste après** la ligne `incrby` des points, ajoute une ligne qui ajoute les points du défi à l'utilisatrice dans `leaderboard`, avec `redis.zincrby`.

**Indice :** le membre, c'est `userId` ; le nombre à ajouter, c'est `challenge.points`.

```ts
// écris ta ligne ici
```

**Test :** valide un défi, puis dans la console Redis : `ZREVRANGE leaderboard 0 -1 WITHSCORES`.

### Étape 2 - La coquille (2 pts)

Écris `GET /leaderboard`, `async`, **sans vigile**, qui répond pour l'instant **200** `[]`.

```ts
// écris ton code ici
```

### Étape 3 - Lire le classement (3 pts)

Au début de la route, lis les 3 premières avec `redis.zrevrange(..., "WITHSCORES")`, dans une variable `raw`. Ajoute un `console.log(raw);`, et regarde la liste plate dans le terminal de `npm run dev`.

```ts
// écris ton code ici
```

### Étape 4 - Transformer, puis répondre (4 pts)

Avec la boucle de l'essentiel, fabrique la liste `ranking`, et réponds avec elle.

```ts
// écris ton code ici
```

**Test :** crée deux comptes, valide des défis avec chacun, puis :

```bash
curl http://localhost:3000/leaderboard
```

Attendu : les utilisatrices, de celle qui a le plus de points à celle qui en a le moins.

---

## Section 2 - Documenter le classement (7 min - 4 pts) `[CP3]`

Dans `openapi.yaml`, ajoute `GET /leaderboard`.

**Le plan :** je relis ma route :

1. le chemin et le verbe ;
2. un `summary` ;
3. un vigile ? → si non, **pas** de `security` ;
4. un paramètre dans l'adresse ? un corps ? ;
5. une réponse pour chaque `res.status(...)`.

Bonus : décris le contenu de la réponse `"200"` (une liste d'objets avec `userId` et `points`), avec `type: array` et `items:`.

```yaml
# écris ton bloc ici
```

Puis **redémarre** le serveur, et teste dans Swagger.

---

*Fin du jour 15 (20 pts). Envoie-moi ta copie : on corrige ensemble.*