# Fiche de révision - Transformer les données, l'ordre d'une route, le cache

---

## 1. Transformer les données : `stringify`, `parse`, `Number`

Redis ne garde que du **texte**. Il faut donc transformer les données à l'aller et au retour.

| Fonction | Transforme… | Exemple | Je l'utilise pour |
| --- | --- | --- | --- |
| `JSON.stringify(x)` | une liste ou un objet → **en texte** | `[{ id: 1 }]` → `'[{"id":1}]'` | **ranger** dans Redis |
| `JSON.parse(x)` | un texte JSON → **en liste ou objet** | `'[{"id":1}]'` → `[{ id: 1 }]` | **relire** depuis Redis |
| `Number(x)` | un texte → **en nombre** | `"30"` → `30` | un compteur relu avec `redis.get` |

**À retenir :**
- **stringify** = je **range** (liste → texte).
- **parse** = je **relis** (texte → liste).
- **Number** = je veux **calculer** (texte → nombre).

### Les deux pièges

- `res.json(cached)` avec un texte déjà en JSON → le client reçoit un texte plein de `\"`. Il faut `res.json(JSON.parse(cached))`.
- `{"totalPoints": stored}` sans `Number` → le client reçoit `"30"` (un texte). `"30" + 10` donne `"3010"`, pas 40.

### `??` : une valeur par défaut

`stored ?? 0` veut dire : « `stored`, **sinon** 0 ». Utile car `redis.get` renvoie **`null`** quand la clé n'existe pas.

```ts
const stored = await redis.get(`points:${userId}`);   // "30" ou null
res.json({ totalPoints: Number(stored ?? 0) });       // 30 ou 0
```

---

## 2. L'ordre dans une route

**Règle : je vérifie tout d'abord, j'écris ensuite, je réponds à la fin.**

| Ordre | Ce que je fais | Exemple |
| --- | --- | --- |
| 1 | les vigiles | `requireAuth` (401), `parseIdParam` (400) |
| 2 | la ressource existe ? | `challenges.find(...)` → 404 |
| 3 | l'action est possible ? | `redis.get(key)` → 409 |
| 4 | **j'écris** | `redis.set(...)`, `redis.incrby(...)` |
| 5 | **je réponds** | `res.status(201).json(...)` |

**Pourquoi :**
- si j'écris **avant** de vérifier → les points sont ajoutés même quand je réponds 409 ;
- si je réponds **avant** de vérifier → la réponse est partie, je ne peux plus répondre 409.

Chaque erreur se termine par **`return`**, pour que le code s'arrête.

---

## 3. La forme d'une route avec cache

```ts
app.get("/challenges", async (req, res) => {
  // 1. Le filtre : pas de cache
  const category = req.query.category;
  if (category) {
    res.json(challenges.filter((challenge) => challenge.category === category));
    return;
  }

  // 2. Le HIT : la copie existe dans Redis
  const cached = await redis.get("cache:challenges");
  if (cached) {
    res.set("X-Cache", "HIT");
    res.json(JSON.parse(cached));
    return;
  }

  // 3. Le MISS : je range la copie pour 60 secondes, puis je réponds
  await redis.set("cache:challenges", JSON.stringify(challenges), "EX", 60);
  res.set("X-Cache", "MISS");
  res.json(challenges);
});
```

**À retenir :**
- la lecture du cache se fait **après** le `if (category)`, **pas dedans** ;
- **HIT** : `redis.get` → `JSON.parse` → `return` ;
- **MISS** : `JSON.stringify` → `redis.set` avec `"EX"` → réponse ;
- quand les données changent (une création) : `redis.del("cache:challenges")`.

| Ligne | Agit sur |
| --- | --- |
| `res.set("X-Cache", "HIT")` | un **en-tête de la réponse** |
| `redis.set("cache:challenges", ...)` | une **clé dans Redis** |