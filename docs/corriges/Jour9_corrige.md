# Jour 9 - Valider un défi, une fois par jour (CORRIGÉ)

- **Ma note :** 17 / 20, ma meilleure note.
- **Ce que je retiens :**
  1. **Une liste vide = 200.** C'est enfin acquis.
  2. **`abc` à la place d'un numéro = 400** (mal écrit). 204, c'est seulement une suppression réussie sans réponse.
  3. Dans une route, je **vérifie tout d'abord** (401, 400, 404, 409), et j'**écris seulement à la fin**.
  4. Je **recopie exactement** les noms et messages de l'énoncé : `challengeId`, pas `challengeID` ; `"Challenge not found"`, pas une traduction.

---

## Section 0 - Révision des codes (4 / 5)

| # | Requête | Code | Pourquoi |
| --- | --- | --- | --- |
| 1 | `GET /challenges?category=sport` | 200 | une recherche vide n'est pas une erreur ✅ 🎉 |
| 2 | `POST /challenges/3/complete` sans jeton | 401 | pas connectée : 1re question ✅ |
| 3 | `POST /challenges/abc/complete` avec jeton | **400** | `abc` n'est pas un nombre : mal écrit ❌ (j'avais mis 204) |
| 4 | `POST /challenges/999/complete` avec jeton | 404 | le défi n°999 n'existe pas ✅ |
| 5 | `POST /challenges/3/complete`, 2e fois aujourd'hui | 409 | déjà fait aujourd'hui ✅ |

---

## Section 1 - `POST /challenges/:id/complete` (13 / 15)

### La route complète

```ts
app.post("/challenges/:id/complete", requireAuth, parseIdParam, async (req, res) => {
  const challenge = challenges.find((c) => c.id === res.locals.id);
  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const userId = res.locals.user.sub;
  const today = new Date().toISOString().slice(0, 10);
  const key = `completed:${userId}:${challenge.id}:${today}`;

  const alreadyDone = await redis.get(key);
  if (alreadyDone) {
    res.status(409).json({ error: "Challenge already completed today" });
    return;
  }

  await redis.set(key, "done", "EX", 86400);
  const totalPoints = await redis.incrby(`points:${userId}`, challenge.points);

  res.status(201).json({ challengeId: challenge.id, points: challenge.points, totalPoints });
});
```

### Ce que fait chaque partie

| Partie | Code de réponse | Brique déjà connue |
| --- | --- | --- |
| `requireAuth` | 401 sans jeton | jour 4, route `/me` |
| `parseIdParam` | 400 si l'id est mal écrit | jour 2, route `/items/:id` |
| `challenges.find(...)` + `if` | 404 si le défi n'existe pas | jour 8, `GET /challenges/:id` |
| `res.locals.user.sub` | | l'id rangé dans le jeton, jour 4 |
| la clé `completed:<user>:<défi>:<date>` | | les backticks, comme `ratelimit:login:${req.ip}` |
| `redis.get(key)` + `if` | 409 si déjà fait | `GET /announcement`, à l'envers |
| `redis.set(key, "done", "EX", 86400)` | | l'annonce de 30 secondes, jour 5 |
| `redis.incrby(...)` | | comme `incr`, avec un autre nombre |

### Les erreurs que j'ai corrigées en chemin

- **`res.status(200)`** dans la coquille → **201** : un `POST` qui enregistre quelque chose répond 201.
- **`res.locals.user.id`** → **`res.locals.user.sub`** : le payload du jeton n'a pas de champ `id`. Avec `.id`, toutes les utilisatrices auraient partagé la même clé (`undefined`).
- **La clé des points `points:${challenge.id}`** → **`points:${userId}`** : le total appartient à l'utilisatrice, pas au défi.
- **`challengeID`** → **`challengeId`** : le nom exact demandé.
- **Le bug caché** : j'avais placé `incrby` **avant** la vérification du 409. Au 2e essai, les points étaient ajoutés, **puis** la route répondait 409. Le total passait à 50 au lieu de 30. Mes tests ne le montraient pas : seul `GET points:1` dans la console Redis le révélait.

### La date du jour

```ts
const today = new Date().toISOString().slice(0, 10);
```

- `new Date()` : maintenant ;
- `.toISOString()` : `2026-11-06T09:30:00.000Z` ;
- `.slice(0, 10)` : les 10 premiers caractères, `2026-11-06`.

Comme la date est dans la clé, la clé change chaque jour : on peut revalider le défi le lendemain.

### Les tests

Remise à zéro dans la console Redis (`docker compose exec redis redis-cli`) :

```
KEYS completed:*
DEL completed:1:3:2026-11-06
DEL points:1
```

Puis, avec un jeton tout neuf :

```bash
curl -i -X POST http://localhost:3000/challenges/3/complete                                   # 401
curl -i -X POST http://localhost:3000/challenges/abc/complete -H "Authorization: Bearer <jeton>" # 400
curl -i -X POST http://localhost:3000/challenges/999/complete -H "Authorization: Bearer <jeton>" # 404
curl -i -X POST http://localhost:3000/challenges/3/complete -H "Authorization: Bearer <jeton>"   # 201, total 20
curl -i -X POST http://localhost:3000/challenges/1/complete -H "Authorization: Bearer <jeton>"   # 201, total 30
curl -i -X POST http://localhost:3000/challenges/3/complete -H "Authorization: Bearer <jeton>"   # 409
```

Et `GET points:1` dans la console Redis : **`"30"`**.

### Rappels pratiques

- À chaque enregistrement de `app.ts`, la liste `users` se vide : je recrée le compte et je récupère un nouveau jeton.
- Les `curl` se tapent dans le terminal **Ubuntu**. Les `KEYS`, `GET`, `DEL` se tapent dans la **console Redis**.