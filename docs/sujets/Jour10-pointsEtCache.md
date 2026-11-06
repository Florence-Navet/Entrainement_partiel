# Jour 10 - Mon total de points, et le catalogue en cache

- **Objet :** séance d'entraînement n°10 pour le partiel EC04, au format des épreuves Markdown de CODA.
- **Durée :** 20 min (3 min de révision + 17 min de code guidé).
- **Modalités :** la section 0 se fait **sans regarder** la fiche de révision. Pour les sections 1 et 2, suis les étapes, une à la fois, et teste après chacune.
- **Projet :** `~/projets/entrainement-partiel`, fichier `src/app.ts`. On reprend **B3** et **B4** du sujet blanc.

---

## Section 0 - Révision (3 min - 5 pts)

**Q0.1 (QCU, 1 pt) `[CP3]`**
`GET /challenges/abc` répond :

- a) 204
- b) 400
- c) 404
- d) 405

**Q0.2 (QCU, 1 pt) `[CP3]`**
Dans une route qui valide un défi, dans quel ordre écrit-on les choses ?

- a) d'abord ajouter les points, puis vérifier le 409
- b) d'abord toutes les vérifications (401, 400, 404, 409), puis les écritures dans Redis
- c) l'ordre n'a pas d'importance
- d) d'abord la réponse 201, puis les vérifications

**Q0.3 (QCU, 1 pt) `[CP8]`**
On relit avec `redis.get` une liste rangée avec `JSON.stringify`. Pour retrouver une vraie liste :

- a) `JSON.stringify(cached)`
- b) `JSON.parse(cached)`
- c) `Number(cached)`
- d) rien, c'est déjà une liste

**Q0.4 (QCU, 1 pt) `[CP8]`**
`redis.get("points:1")` renvoie le total de points. De quel type est la valeur renvoyée ?

- a) un nombre
- b) un texte, ou `null` si la clé n'existe pas
- c) une liste
- d) toujours `0`

**Q0.5 (QCU, 1 pt) `[CP3]`**
Quelle ligne ajoute l'en-tête `X-Cache: HIT` à la réponse ?

- a) `redis.set("X-Cache", "HIT")`
- b) `res.set("X-Cache", "HIT")`
- c) `res.json({ "X-Cache": "HIT" })`
- d) `req.set("X-Cache", "HIT")`

---

## Section 1 - `GET /me/points` (7 min - 6 pts) `[CP3, CP8]`

**Le but :**
- sans jeton → **401** ;
- avec jeton → **200** `{ "totalPoints": 30 }` ;
- si l'utilisatrice n'a encore rien validé → **200** `{ "totalPoints": 0 }`.

> **Où écrire la route :** au-dessus du bloc du 404, sous la définition de `requireAuth`. Par exemple, juste sous ta route `POST /challenges/:id/complete`.

### Étape 1 - La coquille (2 pts)

Écris la route `GET /me/points`, **`async`**, protégée par **`requireAuth`**. Pour l'instant, elle répond **200** `{ "totalPoints": 0 }`.

**Indice :** même forme que ta route `/me`, avec `async` en plus.

```ts
// écris ton code ici
```

**Test :**

```bash
curl -i http://localhost:3000/me/points
curl -i http://localhost:3000/me/points -H "Authorization: Bearer <jeton>"
```

Attendu : **401**, puis **200** `{"totalPoints":0}`.

### Étape 2 - Lire le total dans Redis (2 pts)

Au début de la route :
- récupère l'id de l'utilisatrice dans `res.locals.user.sub`, dans une variable `userId` ;
- lis la clé `points:<userId>` avec `redis.get`, dans une variable `stored`.

Ajoute un `console.log(stored);` pour voir ce que Redis renvoie.

**Indice :** c'est la même clé que celle de ton `incrby`, dans `POST /challenges/:id/complete`.

```ts
// écris ton code ici
```

**Test :** valide un ou deux défis, puis appelle `/me/points`. Dans le terminal de `npm run dev`, tu dois voir `30` (ou ton total). Avec un compte qui n'a rien validé, tu verras `null`.

### Étape 3 - Répondre avec un nombre (2 pts)

`stored` est un **texte** (`"30"`), ou **`null`**. On veut répondre avec un **nombre**, et **0** si c'est `null`.

Remplace le `0` de ta réponse par :

```ts
Number(stored ?? 0)
```

- `stored ?? 0` : « `stored`, **sinon** 0 » (si `stored` vaut `null`) ;
- `Number(...)` : transforme le texte `"30"` en nombre `30`.

```ts
// écris ton code ici
```

**Test :**

```bash
curl http://localhost:3000/me/points -H "Authorization: Bearer <jeton>"
```

Attendu : `{"totalPoints":30}`, avec **30 sans guillemets** (un nombre, pas un texte).

---

## Section 2 - Le catalogue en cache (10 min - 9 pts) `[CP8]`

**Le but :** la liste **complète** des défis (`GET /challenges`, **sans** filtre) est mise en cache dans Redis pendant **60 secondes**. Premier appel : `X-Cache: MISS`. Appels suivants : `X-Cache: HIT`.

Le filtre `?category=` reste **sans** cache : il ne change pas.

**Indice général :** c'est exactement le cache de ta route `/notes` du jour 5, avec la clé `"cache:challenges"`.

### Étape 1 - La route devient `async` (1 pt)

Ajoute `async` devant `(req, res)` dans ta route `GET /challenges`. Ne change rien d'autre. Teste : tout doit marcher comme avant.

### Étape 2 - Le HIT (4 pts)

**Après** le `if (category) { ... }`, et **avant** le `res.json(challenges)` de la fin :
- lis la clé `"cache:challenges"` avec `redis.get`, dans une variable `cached` ;
- si `cached` existe :
  - ajoute l'en-tête `X-Cache: HIT` ;
  - réponds avec la liste retransformée : `JSON.parse(cached)` ;
  - `return`.

```ts
// écris ton code ici
```

### Étape 3 - Le MISS (4 pts)

Juste avant le `res.json(challenges)` de la fin :
- range `JSON.stringify(challenges)` sous `"cache:challenges"`, pour **60 secondes** ;
- ajoute l'en-tête `X-Cache: MISS`.

```ts
// écris ton code ici
```

**Test :**

```bash
curl -i http://localhost:3000/challenges
curl -i http://localhost:3000/challenges
curl -i "http://localhost:3000/challenges?category=carbone"
```

Attendu :
- 1er appel : `X-Cache: MISS`, les trois défis ;
- 2e appel : `X-Cache: HIT`, les trois défis ;
- avec le filtre : **pas** de ligne `X-Cache`, les défis 1 et 3.

Dans la console Redis : `TTL cache:challenges` affiche un nombre qui descend depuis 60.

---

*Fin du jour 10 (20 pts). Envoie-moi tes routes et ta section 0 : on corrige ensemble. Au jour 11 : documenter tout ça dans Swagger (B5), puis un deuxième sujet blanc, plus court.*