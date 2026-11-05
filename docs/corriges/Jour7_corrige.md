# Jour 7 - Sujet blanc EC04 (CORRIGÉ)

- **Ma note :** 40 / 100 (8 / 20). Partie A : 37 / 70 (10,6 / 20). Partie B : 3 / 30.
- **Durée :** 10h30 → 12h02 (1h32).
- **Ce qui est enfin acquis :** bcrypt, `"3600"` = millisecondes, Redis en RAM, `res.set`, `TTL -2 / -1`, le `return` et le `try / catch` d'un vigile.
- **Mes trois priorités :**
  1. **Les codes** : liste vide = **200** ; `abc` à la place d'un id = **400** ; déjà fait aujourd'hui = **409** ; suppression sans rien renvoyer = **204**.
  2. **Assembler seule** les briques que je connais déjà (partie B).
  3. **Ne jamais modifier le code de l'énoncé** : je réponds seulement dans les blocs `> Réponse :`.

---

# Partie A - Sur papier (37 / 70)

## Section 1 - HTTP & REST (7 / 12)

**Q1.1** → **b) PATCH** ✅

**Q1.2** → **c) 204**

❌ J'avais mis « 200 no content ». « No Content », c'est justement le nom du code **204**.

**Q1.3** → **c) 405** ✅

**Q1.4** → **a) 200, avec `[]`**

❌ J'avais mis 404 (5e fois). Une **recherche** qui ne trouve rien est une réponse normale. 404, c'est pour **un** élément précis.

**Q1.5** (4 / 6)

| # | Requête | Code | Pourquoi ? |
| --- | --- | --- | --- |
| 1 | `GET /challenges/3` | 200 | le défi n°3 existe |
| 2 | `GET /challenges/abc` | **400** | `abc` n'est pas un entier : demande mal écrite |
| 3 | `GET /challenges/999` | 404 | le **défi** n°999 n'existe pas (la route, elle, existe) |
| 4 | `POST /challenges/3/complete`, 1re fois | 201 | validation enregistrée |
| 5 | La même, une 2e fois le même jour | **409** | la demande est valide, mais contredit l'état actuel : déjà fait aujourd'hui |
| 6 | `GET /me` sans `Authorization` | 401 | pas de jeton |

❌ Ligne 2 : 405 veut dire « pas ce verbe », pas « mal écrit ». Ligne 5 : 401 veut dire « pas connecté » ; or l'utilisatrice **est** connectée.

## Section 2 - Express (7 / 12)

**Q2.1** → **c) `req.params.name`** ✅

**Q2.2** → **b) `req.body.text`** ✅

**Q2.3** (0 / 2)

- a) il reçoit `req`, `res` et `next`, dans cet ordre
- b) il doit soit appeler `next()`, soit répondre lui-même
- c) `res.locals` permet de passer une information à la route suivante

❌ J'avais oublié **c)** et ajouté **d)**. Un middleware posé **sur une route** (`app.get("/me", requireAuth, ...)`) ne s'applique **qu'à elle**.

**Q2.4** (3 / 4)

> **Réponse a) :** **404** `Not found`. Le bloc du 404 est écrit **au-dessus** de `/ping` : Express s'arrête dessus.
>
> **Réponse b) :** `ReferenceError: req is not defined`. Le paramètre s'appelle `_req`, mais le code utilise `req`. Correction : renommer `_req` en `req`.

⚠️ J'avais la correction, mais pas le message d'erreur.

**Q2.5** (2 / 4)

```ts
const parseIdParam = (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  res.locals.id = id;
  next();
};
```

⚠️ Il manquait le **`return`** (sans lui, le code continue jusqu'à `next()`), et le **`.json`** dans `res.status(400).json(...)`. Les fautes de frappe (`Respons`, `IsInterger`) sont tolérées sur papier.

## Section 3 - Validation & DTO (5 / 8)

**Q3.1** → **b) `undefined`** ✅

**Q3.2** (2 / 4)

```ts
const RegisterSchema = z.object({
  email: z.string(),
  password: z.string().min(8),
});

const result = RegisterSchema.safeParse(req.body);
if (!result.success) {
  res.status(400).json({ errors: result.error.issues });
  return;
}
```

⚠️ Les règles étaient **inversées** : j'avais mis le `.min(8)` sur l'email, et `.min(1).max(140)` sur le mot de passe (recopié de `NoteSchema`). Il manquait aussi le `return`.

**Q3.3** (2 / 3)

> **Réponse :** un DTO est l'objet que je **choisis** de renvoyer au client, avec seulement les champs utiles. Pour `POST /users`, l'utilisateur enregistré contient `id`, `email` et `passwordHash`, mais je renvoie seulement `{ id, email }`. Le mot de passe ne sort jamais.

⚠️ Mon exemple était juste. La définition était trop vague : l'idée clé est **choisir ce qui sort**.

## Section 4 - Sécurité (10 / 16)

**Q4.1** → **b) un hash bcrypt** ✅ 🎉

**Q4.2** → **c) 3600 millisecondes** ✅ 🎉

**Q4.3** (0 / 2)

- a) `sub`, l'id de l'utilisateur
- b) son email
- d) `exp`, la date d'expiration

❌ J'avais mis **c) le hash du mot de passe**. Le payload est **lisible par tout le monde** : jamais rien de lié au mot de passe dedans.

**Q4.4** (0 / 2)

> **Réponse :** la **signature**. Elle est calculée avec un **secret** que seul le serveur connaît. Si le client modifie le payload, la signature ne correspond plus, et `jwt.verify` refuse le jeton.

❌ J'avais parlé de la date d'expiration : elle dit **jusqu'à quand** le jeton est valable, pas s'il a été modifié.

**Q4.5** (1 / 2)

> **Réponse :** pour **ne pas** indiquer à un pirate si un compte existe avec cet email.

⚠️ J'avais écrit « pour **préciser** à un potentiel hacker », c'est-à-dire l'inverse. Attention au sens des mots.

**Q4.6** (4 / 4)

> **Réponse a) :** il manque **`return;`**. Sans lui, le code continue après le 401 : il essaie de lire le jeton, et l'API tente d'envoyer une deuxième réponse.
>
> **Réponse b) :** `jwt.verify` **lance une erreur** quand le jeton est faux. Personne ne l'attrape, donc le gestionnaire d'erreurs répond 500. Il faut l'entourer d'un `try / catch` qui répond **401 `Invalid token`**.

✅ Mais attention : j'avais **modifié le code de l'énoncé** (ajouté le `try / catch` dedans). Au partiel, c'est interdit : on répond seulement dans les blocs `> Réponse :`.

**Q4.7** (3 / 4)

> **Réponse :** un vigile posé sur `POST /login`. La clé contient l'**adresse IP** : `ratelimit:login:<ip>`. À chaque tentative, `redis.incr(cle)`. Si le compteur vaut 1, `redis.expire(cle, 60)`. Si le compteur dépasse 5 : on lit `redis.ttl(cle)`, on ajoute l'en-tête `Retry-After` avec `res.set`, et on répond **429**.

⚠️ Tout y était, sauf les noms exacts des commandes (`incr`, `expire`, `ttl`). Et c'est l'adresse **IP**, pas « id ».

## Section 5 - Redis (5 / 14)

**Q5.1** → **b) en mémoire (RAM)** ✅ 🎉

**Q5.2** → **b) `res.set("X-Cache", "MISS")`** ✅ 🎉

**Q5.3** (1 / 4)

| Besoin | Commande ioredis |
| --- | --- |
| ranger `"ok"` sous `status` pour 60 secondes | `await redis.set("status", "ok", "EX", 60)` |
| lire `status` | `await redis.get("status")` |
| ajouter 1 à `visits` | `await redis.incr("visits")` |
| supprimer `cache:challenges` | `await redis.del("cache:challenges")` |

❌ J'avais écrit les commandes de la **console Redis** (`GET`, `DELETE`), incomplètes. En TypeScript, on écrit `redis.` devant, en minuscules, avec les arguments entre parenthèses. Et la suppression, c'est **`del`**.

**Q5.4** ✅ 🎉

> **Réponse :** `-2` : la clé n'existe pas. `-1` : elle existe, sans durée de vie.

**Q5.5** (0 / 6)

> **Réponse a) :** `cached` est **déjà du texte JSON** (rangé avec `JSON.stringify`). `res.json(cached)` le transforme une **deuxième** fois. Il faut écrire `res.json(JSON.parse(cached))`, ou `res.type("json").send(cached)`.
>
> **Réponse b) :** sans durée de vie, le cache **ne s'efface jamais** : si les défis changent, le client voit la vieille liste pour toujours. Correction : `await redis.set("cache:challenges", JSON.stringify(challenges), "EX", 60);`
>
> **Réponse c) :** dans la route qui **crée** un défi, juste après l'ajout : `await redis.del("cache:challenges");`. Le prochain `GET` sera un MISS, avec la liste à jour.

❌ J'avais modifié le code de l'énoncé au lieu de répondre. Mes modifications étaient en plus fausses : `"EX", 60` ne va pas dans `redis.get`, et le `redis.del` juste après le `set` effaçait le cache à chaque fois. Pourtant, j'ai écrit exactement ce code juste, dans la route `/notes` du jour 5.

## Section 6 - OpenAPI (3 / 8)

**Q6.1** (1 / 2)

- a) les adresses et verbes des routes
- b) les réponses possibles avec leurs codes
- c) si une route demande un jeton

⚠️ J'avais oublié **c)** (le cadenas, `security: - bearerAuth: []`).

**Q6.2** (2 / 3)

> **Réponse :** `/users:` a 4 espaces au lieu de 2. YAML le range **à l'intérieur** de `/ping`. Il faut l'aligner avec `/ping:`, avec 2 espaces.

⚠️ J'avais trouvé l'indentation, mais pas dit **comment** corriger.

**Q6.3** (0 / 3)

> **Réponse :** Swagger n'a pas envoyé de jeton : il n'a pas été donné au bouton **Authorize**. Il faut se connecter avec `POST /login`, copier `accessToken`, cliquer sur **Authorize**, coller le jeton, puis **Authorize** et **Close**. Le cadenas se ferme, et `/me` répond 200.

❌ C'est exactement ce qui m'était arrivé au jour 6.

---

# Partie B - Dans le projet (3 / 30)

## B1 - Le catalogue (3 / 6)

```ts
app.get("/challenges", (req, res) => {
  const category = req.query.category;
  if (category) {
    res.json(challenges.filter((c) => c.category === category));
    return;
  }
  res.json(challenges);
});

app.get("/challenges/:id", parseIdParam, (req, res) => {
  const challenge = challenges.find((c) => c.id === res.locals.id);
  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }
  res.json(challenge);
});
```

⚠️ Ce qui marchait : la liste, le défi n°3, le 404. Ce qui manquait :
- **le filtre `?category=`** : mon test 2 renvoyait toute la liste. On lit `req.query.category`, et on filtre avec `.filter(...)` (vu au jour 1) ;
- **`parseIdParam`** : sans lui, `abc` donnait un 404 au lieu d'un **400**. Le vigile se pose entre l'adresse et la route, et l'id se lit ensuite dans `res.locals.id`.

## B2 - Valider un défi une fois par jour (0 / 10)

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

  await redis.set(key, "1", "EX", 86400);
  const totalPoints = await redis.incrby(`points:${userId}`, challenge.points);

  res.status(201).json({ challengeId: challenge.id, points: challenge.points, totalPoints });
});
```

Ce que fait chaque partie, avec les briques que je connais déjà :
- **`requireAuth, parseIdParam`** : deux vigiles à la suite, séparés par une virgule. Le premier vérifie le jeton, le second l'id ;
- **le 404** : comme B1 ;
- **`res.locals.user.sub`** : l'id de l'utilisatrice, rangé par `requireAuth` (comme dans `/me`) ;
- **`today`** : la date du jour, par exemple `2026-11-05`. Elle entre dans la clé, donc la clé change chaque jour ;
- **la clé `completed:<user>:<défi>:<date>`** : un post-it « déjà fait aujourd'hui », pour **24 heures** (`86400` secondes). Même idée que l'annonce de 30 secondes du jour 5 ;
- **`redis.get` puis 409** : si le post-it existe déjà → déjà fait → **409**. Même forme que le `GET /announcement` ;
- **`redis.incrby`** : comme `incr`, mais en ajoutant les points du défi au lieu de 1. Il renvoie le nouveau total.

Mon code n'utilisait ni `requireAuth`, ni le défi demandé : il rangeait un texte écrit en dur. C'était un brouillon.

## B3 - Mon total de points (0 / 4)

```ts
app.get("/me/points", requireAuth, async (req, res) => {
  const stored = await redis.get(`points:${res.locals.user.sub}`);
  res.json({ totalPoints: Number(stored ?? 0) });
});
```

- `redis.get` renvoie le total **en texte**, ou `null` si rien n'a été validé ;
- `stored ?? 0` : « `stored`, **sinon** 0 » (vu au jour 2 avec `JWT_EXPIRES_IN ?? "1h"`) ;
- `Number(...)` : transforme le texte en nombre.

## B4 - Le catalogue en cache (0 / 5)

On garde le filtre sans cache, et on met en cache seulement la liste complète :

```ts
app.get("/challenges", async (req, res) => {
  const category = req.query.category;
  if (category) {
    res.json(challenges.filter((c) => c.category === category));
    return;
  }

  const cached = await redis.get("cache:challenges");
  if (cached) {
    res.set("X-Cache", "HIT");
    res.json(JSON.parse(cached));
    return;
  }

  await redis.set("cache:challenges", JSON.stringify(challenges), "EX", 60);
  res.set("X-Cache", "MISS");
  res.json(challenges);
});
```

C'est exactement le cache de `/notes` du jour 5, avec un autre nom de clé.

## B5 - Documenter la validation (0 / 5)

Sous `paths:`, aligné avec `/ping:` (2 espaces) :

```yaml
  /challenges/{id}/complete:
    post:
      summary: Valider un défi pour aujourd'hui
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        "201":
          description: Défi validé, points ajoutés
        "401":
          description: Jeton absent ou invalide
        "404":
          description: Défi introuvable
        "409":
          description: Défi déjà validé aujourd'hui
```

Dans OpenAPI, le paramètre s'écrit **`{id}`** avec des accolades. Dans Express, c'est **`:id`**. Ce sont deux écritures pour la même chose.

---

## Ce que je retiens pour le jour J

- **Gérer le temps** : si une question de la partie B bloque plus de 10 minutes, passer à la suivante. Écrire la **forme** d'une route (vigiles, 404, réponse) rapporte déjà des points, même si tout ne marche pas.
- **Partir de ce que j'ai déjà écrit** : B2 = `requireAuth` + `parseIdParam` + le 404 de B1 + le `GET /announcement` (post-it + `if` + erreur) + `incr` (le compteur).
- **Ne jamais toucher au code de l'énoncé.**