# Jour 14 - Modifier un défi (PATCH)

- **Objet :** séance mixte : 4 QCU d'échauffement, une nouvelle route dans le projet, et sa documentation.
- **Durée :** 25 min (3 min de QCU + 15 min de code + 7 min de YAML).
- **Modalités :** les QCU se font **sans** les fiches. Pour le code et le YAML, suis le plan, une étape à la fois, et teste après chacune.
- **Projet :** `~/projets/entrainement-partiel`.

---

## Section 0 - Échauffement (3 min - 4 pts)

**Q0.1 (QCU, 1 pt)** Quelle ligne ajoute l'en-tête `Retry-After` à la réponse ?

<!-- - a) `redis.set("Retry-After", String(ttl))` -->
- b) `res.set("Retry-After", String(ttl))`
<!-- - c) `req.set("Retry-After", String(ttl))`
- d) `res.json({ "Retry-After": ttl })` -->

**Q0.2 (QCU, 1 pt)** Quel verbe HTTP sert à **modifier une partie** d'une ressource ?

<!-- - a) PUT -->
- b) PATCH
<!-- - c) POST
- d) DELETE -->

**Q0.3 (QCU, 1 pt)** La route OpenAPI `/challenges/{id}` s'écrit, dans Express :

<!-- - a) `/challenges/{id}` -->
- b) `/challenges/:id`
<!-- - c) `/challenges/id`
- d) `/challenges/$id` -->

**Q0.4 (QCU, 1 pt)** Quelle affirmation est **fausse** ?

<!-- - a) `redis.set` range une clé dans Redis
- b) `res.set` ajoute un en-tête à la réponse -->
- c) le client voit les clés Redis avec `curl -i`
<!-- - d) `curl -i` affiche les en-têtes de la réponse -->

---

## Section 1 - `PATCH /challenges/:id` dans le projet (15 min - 12 pts) `[CP3, CP8]`

**Le but :** modifier les **points** d'un défi existant.

- sans jeton → **401** ;
- id mal écrit → **400** ;
- `points` absent, pas un nombre, ou pas positif → **400** avec la liste des erreurs ;
- défi inexistant → **404** `{ "error": "Challenge not found" }` ;
- sinon → les points du défi sont modifiés, le cache du catalogue est supprimé, et la route répond **200** avec le défi modifié.

> Où écrire : au-dessus du bloc du 404, sous `requireAuth` et `parseIdParam`.

### Étape 1 - Le schéma (2 pts)

En haut du fichier, à côté de `ChallengeSchema`, écris un schéma **`PointsSchema`** : un objet avec un seul champ, `points`, qui est un **nombre positif**.

```ts
const PointSchema = z.object({
    points: z.number().positive

});
```

### Étape 2 - La coquille (2 pts)

Écris la route : le verbe **`patch`**, l'adresse avec la case `:id`, les deux vigiles, `async`, et pour l'instant une réponse **200** `{ "message": "ok" }`.

```ts
app.patch("/challenges/:id", requireAuth, parseIdParam, (req, res) => {

    const response = "message ok";
  res.status(200).json({ message: response });

});
```

**Test :**

```bash
curl -i -X PATCH http://localhost:3000/challenges/1
curl -i -X PATCH http://localhost:3000/challenges/1 -H "Authorization: Bearer $TOKEN"
```

Attendu : **401**, puis **200** `ok`.

### Étape 3 - Vérifier, dans l'ordre (4 pts)

Au début de la route, **avant** la réponse :

1. vérifie `req.body` avec `PointsSchema` → **400** avec `errors` si c'est invalide, puis `return` ;
2. cherche le défi avec `challenges.find(...)` et `res.locals.id` → **404** s'il n'existe pas, puis `return`.

**Indice :** le bloc Zod de `POST /challenges`, puis le bloc 404 de `GET /challenges/:id`.

```ts
app.patch("/challenges/:id", requireAuth, parseIdParam, async (req, res) => {

  const result = PointSchema.safeParse(req.body);
  const response = res.locals.id;
  const challenge = challenges.find((c) => c.id === response);
  if(!result.success) {
    res.status(400).json({errors:result.error.issues});
    return;
  }
  if(!challenge) {
    res.status(404).json({error:"Challenge not found"});
    return;
  }
  challenge.points = result.data.points;
  await redis.del("cache:challenges");

  // const message = "message ok";
  res.status(200).json(challenge);

});
```

**Test :**

```bash
curl -i -X PATCH http://localhost:3000/challenges/1 -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"points":-5}'
curl -i -X PATCH http://localhost:3000/challenges/999 -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"points":50}'
```

Attendu : **400**, puis **404**.

### Étape 4 - Écrire, puis répondre (4 pts)

Après les vérifications (**V.E.R.**) :

1. remplace les points du défi par `result.data.points` ;
2. supprime la clé du cache du catalogue (copie-colle son nom depuis `GET /challenges`) ;
3. réponds **200** avec le défi modifié.

**Indice :** le défi trouvé par `find` est **le même objet** que celui de la liste. Si je change `challenge.points`, la liste est modifiée aussi.

```ts
app.patch("/challenges/:id", requireAuth, parseIdParam, async (req, res) => {

  const result = PointSchema.safeParse(req.body);
  const response = res.locals.id;
  const challenge = challenges.find((c) => c.id === response);
  if(!result.success) {
    res.status(400).json({errors:result.error.issues});
    return;
  }
  if(!challenge) {
    res.status(404).json({error:"Challenge not found"});
    return;
  }
  challenge.points = result.data.points;
  await redis.del("cache:challenges");

  // const message = "message ok";
  res.status(200).json(challenge);

});
```

**Test :**

```bash
curl -i -X PATCH http://localhost:3000/challenges/1 -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"points":50}'
curl -i http://localhost:3000/challenges/1
curl -i http://localhost:3000/challenges
```

Attendu : **200** avec `"points":50` ; puis le défi 1 avec 50 points ; puis la liste en **MISS**, avec le défi 1 à 50 points.

---

## Section 2 - Documenter la route (7 min - 4 pts) `[CP3]`

Dans `openapi.yaml`, ajoute `PATCH` sous le chemin **`/challenges/{id}:`**, qui existe déjà pour le `delete:`.

**Attention :** je n'écris **pas** une deuxième fois `/challenges/{id}:` (sinon : `DUPLICATE_KEY`). J'ajoute **`patch:`** **sous le même chemin**, au même niveau que `delete:` (4 espaces).

**Le plan :** je relis ma route, ligne par ligne :

1. `patch:` et un `summary` ;
2. `requireAuth` → ? ;
3. `:id` → ? ;
4. `req.body` avec `points` → ? (un nombre) ;
5. une réponse pour chaque `res.status(...)`, vigiles compris.

```yaml
# écris ton bloc ici
```

Puis **redémarre** le serveur, et teste dans Swagger avec **Authorize**.

---

*Fin du jour 14 (20 pts). Envoie-moi ta copie : on corrige ensemble.*