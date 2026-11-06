# Jour 10 - Mon total de points, et le catalogue en cache (CORRIGÉ)

- **Ma note :** 14 / 20. Après correction, les deux routes marchent.
- **Ce que je retiens :**
  1. **stringify** = je range (liste → texte) · **parse** = je relis (texte → liste) · **Number** = je calcule (texte → nombre).
  2. Dans une route : je **vérifie**, puis j'**écris**, puis je **réponds**.
  3. La lecture du cache se fait **après** le `if (category)`, pas dedans.
  4. Pour comprendre un bug, je suis le code **ligne par ligne**, dans chaque situation (avec filtre, sans filtre).

---

## Section 0 - Révision (3 / 5)

**Q0.1** `GET /challenges/abc` → **b) 400** ✅

**Q0.2** L'ordre dans une route :

- b) d'abord toutes les vérifications (401, 400, 404, 409), puis les écritures dans Redis

❌ J'avais mis « d'abord la réponse 201 ». Une fois la réponse envoyée, je ne peux plus répondre 409. Et si j'écris avant de vérifier, j'ajoute des points même quand je réponds 409 (mon bug du jour 9).

**Q0.3** Relire une liste rangée avec `JSON.stringify` :

- b) `JSON.parse(cached)`

❌ J'avais gardé les quatre lignes, car je ne connaissais pas la différence :

| Fonction | Transforme… | Exemple |
| --- | --- | --- |
| `JSON.stringify(x)` | une liste → en texte | `[{ id: 1 }]` → `'[{"id":1}]'` |
| `JSON.parse(x)` | un texte JSON → en liste | `'[{"id":1}]'` → `[{ id: 1 }]` |
| `Number(x)` | un texte → en nombre | `"30"` → `30` |

**Q0.4** Ce que renvoie `redis.get("points:1")` → **b) un texte, ou `null` si la clé n'existe pas** ✅

**Q0.5** Ajouter l'en-tête `X-Cache: HIT` → **b) `res.set("X-Cache", "HIT")`** ✅

---

## Section 1 - `GET /me/points` (6 / 6)

```ts
app.get("/me/points", requireAuth, async (req, res) => {
  const userId = res.locals.user.sub;
  const stored = await redis.get(`points:${userId}`);
  res.status(200).json({ totalPoints: Number(stored ?? 0) });
});
```

✅ Ce que fait chaque ligne :
- `requireAuth` : 401 sans jeton, et range l'utilisatrice dans `res.locals.user` ;
- `res.locals.user.sub` : son id ;
- `redis.get(...)` : la même clé que l'`incrby` de `POST /challenges/:id/complete`. Renvoie `"30"` (un texte) ou `null` ;
- `stored ?? 0` : `stored`, sinon 0 ;
- `Number(...)` : `"30"` devient `30`.

Le `console.log(stored)` m'a permis de voir `30` dans le terminal pendant que la réponse disait encore `0` : c'est une bonne façon de vérifier une étape avant la suivante.

Rappel : `"totalpoints"` (p minuscule) → **`totalPoints`**.

---

## Section 2 - Le catalogue en cache (5 / 9)

```ts
app.get("/challenges", async (req, res) => {
  const category = req.query.category;
  if (category) {
    res.json(challenges.filter((challenge) => challenge.category === category));
    return;
  }

  const cached = await redis.get("cache:challenges");
  if (cached) {
    res.set("X-Cache", "HIT");
    res.json({ message: "la liste des challenges est:", challenges: JSON.parse(cached) });
    return;
  }

  res.set("X-Cache", "MISS");
  await redis.set("cache:challenges", JSON.stringify(challenges), "EX", 60);
  res.json({ message: "la liste des challenges est:", challenges });
});
```

⚠️ J'avais écrit la lecture du cache **à l'intérieur** du `if (category)`. En suivant le code ligne par ligne :
- **sans filtre** : on saute le `if`, donc on ne lit jamais le cache → **toujours MISS** ;
- **avec filtre** : on entre dans le `if`, on lit le cache rempli par un appel sans filtre → **HIT avec les trois défis**, le filtre est ignoré.

La correction : **déplacer** les lignes du HIT juste **après** l'accolade qui ferme le `if (category)`.

### Les tests

```bash
curl -i http://localhost:3000/challenges                      # X-Cache: MISS, 3 défis
curl -i http://localhost:3000/challenges                      # X-Cache: HIT, 3 défis
curl -i "http://localhost:3000/challenges?category=carbone"   # pas de X-Cache, défis 1 et 3
```

Si le premier appel est déjà un HIT, le cache existe depuis un essai précédent : `DEL cache:challenges` dans la console Redis.

---

## Où j'en suis sur le sujet blanc

| Question | Points | Au sujet blanc | Refaite |
| --- | --- | --- | --- |
| B1 - le catalogue | 6 | 3 | ✅ jour 8 |
| B2 - valider un défi (409) | 10 | 0 | ✅ jour 9 |
| B3 - mon total de points | 4 | 0 | ✅ jour 10 |
| B4 - le cache | 5 | 0 | ✅ jour 10 |
| B5 - la documentation | 5 | 0 | jour 11 |