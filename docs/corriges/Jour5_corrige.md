# Jour 5 - Redis : compteur, durée de vie et cache (CORRIGÉ)

- **Ma note :** 22 / 35 (12,6 / 20)
- **Le bilan :** mon code est presque parfait (15 / 16), mais je n'arrive pas encore à **expliquer** ce que je fais (Section 2 : 0 / 6).
- **Les idées à retenir :**
  1. **bcrypt** hache le mot de passe. Le **JWT** est le jeton donné après la connexion.
  2. `expiresIn: 3600` (nombre) = 3600 **secondes**. `"3600"` (texte) = 3600 **millisecondes**.
  3. Redis garde tout **en mémoire** (RAM), en **clé → valeur**.
  4. Redis ne range que du **texte** : `JSON.stringify` pour ranger, `JSON.parse` pour relire.
  5. Un en-tête HTTP s'ajoute avec **`res.set`**, pas avec `redis.set`.

---

## Section 0 - Révision du jour 4 (2 / 5)

**Q0.1** Pour enregistrer un mot de passe :

- b) un hash bcrypt

❌ J'ai encore mis JWT (4e fois). Le JWT n'enregistre rien. Moyen de m'en souvenir : **b**crypt pour la **b**ase, **J**WT pour le **J**eton.

**Q0.2** `expiresIn: "3600"`, avec des guillemets :

- c) 3600 millisecondes (3,6 secondes)

❌ J'avais mis 3600 secondes. C'est le bug que j'ai eu pour de vrai au jour 4 : mon jeton durait 3 secondes (`exp - iat = 3`).

**Q0.3** Où ranger l'utilisateur dans un vigile ?

- b) `res.locals.user`

✅

**Q0.4** Pourquoi le même message à la connexion ?

> **Réponse :** pour qu'un pirate ne puisse pas savoir **quels emails ont un compte**. Avec deux messages différents, il testerait une liste d'emails et verrait lesquels existent.

⚠️ J'avais l'idée (« ne pas donner trop d'infos »), mais pas la raison précise.

---

## Section 1 - Comprendre (5 / 8)

**Q1.1** Où Redis garde-t-il ses données ?

- b) en mémoire (RAM)

❌ J'avais mis « sur le disque ». C'est justement **la** différence avec PostgreSQL, et ce qui le rend si rapide.

**Q1.2** `redis.get` sur une clé inexistante → **c) `null`** ✅

**Q1.3** Ranger 60 secondes → **b) `redis.set("message", "bonjour", "EX", 60)`** ✅

**Q1.4** Pour quoi Redis est-il adapté ?

- a) un compteur de visites
- b) un cache de réponses
- d) une valeur qui doit s'effacer au bout de 5 minutes

⚠️ Je n'avais gardé que b). Pourtant, j'ai fait **les trois** dans ce jour 5 : le compteur `/visits` (a), le cache `/notes` (b), l'annonce de 30 secondes (d). Seul c) est faux : les comptes utilisateurs doivent rester **pour toujours**, c'est le rôle de PostgreSQL.

**Q1.5** `X-Cache: HIT` → **b) la réponse vient du cache Redis** ✅

**Q1.6** Pourquoi supprimer `cache:notes` après un `POST /notes` ?

> **Réponse :** le post-it a été écrit **avant** la nouvelle note. Sans le supprimer, le `GET /notes` répondrait avec cette vieille copie (HIT) jusqu'à la fin des 60 secondes : le client ne verrait pas la note qu'il vient de créer. En le supprimant, le prochain `GET` est un MISS, avec la liste à jour.

⚠️ J'avais l'idée (« toujours le même cache »), mais pas l'explication complète.

---

## Section 2 - Lire du code (0 / 6)

```ts
app.get("/notes", async (req, res) => {
  const cached = await redis.get("cache:notes");
  if (cached !== null) {
    res.json(cached);
    return;
  }
  await redis.set("cache:notes", JSON.stringify(notes));
  res.json(notes);
});
```

> **Réponse a) :** `cached` est **déjà du texte JSON** : on l'a rangé avec `JSON.stringify`. `res.json(...)` le transforme en JSON **une deuxième fois** : le client reçoit un texte, avec des `\"`. Il faut soit l'envoyer tel quel avec `res.type("json").send(cached)`, soit le retransformer en liste avec `res.json(JSON.parse(cached))`.
>
> **Réponse b) :** sans durée de vie, le post-it **ne s'efface jamais** (son `TTL` vaut `-1`). Si les notes changent, le client voit la vieille copie **pour toujours**. Correction : `await redis.set("cache:notes", JSON.stringify(notes), "EX", 60);`
>
> **Réponse c) :** `res.set("X-Cache", "HIT")` **dans le `if`**, avant le `res.json(cached)`. `res.set("X-Cache", "MISS")` **après le `if`**, avant le `res.json(notes)`.

❌ Les trois étaient fausses ou vides. Pourtant :
- pour a), c'est **exactement** ce que j'ai fait à la Q3.3 avec `JSON.parse(cached)` ;
- pour b), c'est le `"EX", 60` que j'ai écrit moi-même ;
- pour c), un **en-tête HTTP** s'ajoute à la **réponse**, avec **`res.set`**. `redis.set` range une valeur **dans Redis** : ce sont deux choses différentes.

| Ligne | Elle agit sur |
| --- | --- |
| `res.set("X-Cache", "HIT")` | la **réponse** envoyée au client (un en-tête) |
| `redis.set("cache:notes", ...)` | la **base Redis** (une clé) |

---

## Section 3 - Code guidé (15 / 16)

### Q3.1 - Le compteur de visites (3 / 4)

```ts
app.get("/visits", async (req, res) => {
  const visits = await redis.incr("visits");

  for (let i = 0; i < visits; i++) {
    console.log(`Visit number: ${i}`);
  }

  res.json({ message: "merci pour les visites", visits });
});
```

✅ Le code marche. La boucle utilise `visits` (un nombre) comme limite, sans `.length`.

> **Pourquoi le compteur continue après un redémarrage, alors que `notes` se vide :** la liste `notes` est rangée dans la **mémoire du serveur Node** : elle est effacée quand il redémarre. Le compteur `visits` est rangé **dans Redis**, qui tourne à part, dans son conteneur Docker : il continue d'exister.

⚠️ J'avais répondu « je ne sais pas », alors qu'on l'avait vu ensemble.

À retenir aussi : `{ visits }` est un raccourci pour `{ visits: visits }`, quand l'étiquette et la variable ont le même nom.

### Q3.2 - L'annonce de 30 secondes (4 / 4)

```ts
app.post("/announcement", async (req, res) => {
  const text = req.body.text;
  await redis.set("announcement", text, "EX", 30);
  res.status(201).json({ text: text, expiresIn: 30 });
});

app.get("/announcement", async (req, res) => {
  const text = await redis.get("announcement");
  if (!text) {
    res.status(404).json({ error: "No announcement" });
    return;
  }
  res.status(200).json({ text: text });
});
```

✅ Ce que j'ai appris en l'écrivant :
- **`req.body.text`** : la valeur rangée sous le nom `text`, dans ce que le client envoie après `-d` ;
- **l'ordre de `redis.set`** : la clé, la valeur, `"EX"`, la durée ;
- **la clé est un nom fixe** (`"announcement"`), pas le texte lui-même : sinon, le `GET` ne pourrait pas la retrouver ;
- **un `GET` lit seulement**, il n'écrit jamais. C'est le `POST` qui range ;
- `incr` sert à **compter**, `set` à **ranger**.

### Q3.3 - Le cache sur `GET /notes` (5 / 5)

```ts
app.get("/notes", async (req, res) => {
  const cached = await redis.get("cache:notes");

  if (cached) {
    res.set("X-Cache", "HIT");
    res.json({ message: "la liste des notes est :", notes: JSON.parse(cached) });
    return;
  }

  res.set("X-Cache", "MISS");
  await redis.set("cache:notes", JSON.stringify(notes), "EX", 60);

  const response = "la liste des notes est :";
  res.json({ message: response, notes: notes });
});
```

✅ Résultat obtenu : `X-Cache: MISS` au premier appel, `X-Cache: HIT` au suivant.

Ce que j'ai appris en l'écrivant :
- la clé est un **nom fixe entre guillemets** (`"cache:notes"`), la valeur est la **variable** `notes` ;
- le cas HIT d'abord, avec `return`, puis le MISS en dessous ;
- le nom exact de l'en-tête : **`X-Cache`**, avec `HIT` et `MISS` en majuscules.

### Q3.4 - L'invalidation (3 / 3)

```ts
app.post("/notes", async (req, res) => {
  const result = NoteSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }

  const note = { id: notes.length + 1, text: result.data.text };
  notes.push(note);

  await redis.del("cache:notes");
  res.status(201).json(note);
});
```

✅ Après une nouvelle note, le post-it est supprimé : le `GET` suivant est un MISS, avec la liste à jour.

---

## Dans la console Redis

```bash
docker compose exec redis redis-cli
```

| Commande | Ce qu'elle montre |
| --- | --- |
| `KEYS *` | toutes les clés |
| `GET visits` | la valeur d'une clé, ou `(nil)` |
| `TTL announcement` | les secondes restantes |

Les trois réponses possibles de `TTL` :

| `TTL` répond | Ça veut dire |
| --- | --- |
| un nombre positif | il reste ce nombre de secondes |
| `-1` | la clé existe, sans durée de vie |
| `-2` | la clé n'existe pas |

## Les pièges rencontrés pendant la séance

- **`curl` tapé dans la console Redis** : Redis ne connaît que ses commandes. `curl` se tape dans le terminal **Ubuntu**. Avoir deux terminaux ouverts côte à côte.
- **`GET cache: notes`** avec un espace : l'espace sépare les morceaux d'une commande. Écrire `GET cache:notes`.
- **Une requête SQL sur une table `visits`** qui n'existe pas : le compteur est dans **Redis**, pas dans PostgreSQL.
- **`.length` sur un nombre** : il n'existe que pour une liste ou un texte. Un nombre sert directement de limite : `i < visits`.