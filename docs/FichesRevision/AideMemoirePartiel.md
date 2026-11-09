# Aide-mémoire du partiel EC04

> Le kit minimum, rangé par questions. Les lignes marquées ⚠️ corrigent une erreur de mes notes.

---

## 1. Les questions à me poser

### Où le client a-t-il mis l'information ?

| Dans… | Exemple | Je lis |
| --- | --- | --- |
| le chemin | `/challenges/3` | `req.params.id` |
| après le `?` | `/challenges?category=carbone` | `req.query.category` |
| le corps (`-d`) | `{"text":"bonjour"}` | `req.body.text` |
| un en-tête | `Authorization: Bearer <jeton>` | `req.headers.authorization` |

- `params` a été **déclaré dans la route** (`/challenges/:id`). `query` est ajouté librement par le client après le `?`.
- `req.query.category` vaut `undefined` s'il n'y a pas de `?category=`.
- `req.body` vaut `undefined` sans `app.use(express.json())`.

### Je cherche quoi dans une liste ?

| Je veux… | J'utilise | Ça renvoie |
| --- | --- | --- |
| **un seul** élément | `liste.find((x) => x.id === id)` | l'élément, ou `undefined` |
| **plusieurs** éléments | `liste.filter((x) => x.category === category)` | une liste (peut-être vide) |

**find** = **un** seul · **filter** = **plusieurs**. Le `x` est un nom que je choisis : à chaque tour, il contient un élément.

### Je veux faire quoi dans Redis ?

| Je veux… | Commande |
| --- | --- |
| lire | `await redis.get("cle")` → le texte, ou `null` |
| ranger | `await redis.set("cle", "valeur")` |
| ranger pour 60 s | `await redis.set("cle", "valeur", "EX", 60)` |
| ajouter 1 | `await redis.incr("cle")` |
| ajouter 20 | `await redis.incrby("cle", 20)` |
| supprimer | `await redis.del("cle")` |
| donner une durée de vie | `await redis.expire("cle", 60)` |
| le temps restant | `await redis.ttl("cle")` |

### Je transforme quoi ?

| Je veux… | J'utilise |
| --- | --- |
| **ranger** une liste dans Redis (liste → texte) | `JSON.stringify(liste)` |
| **relire** une liste depuis Redis (texte → liste) | `JSON.parse(texte)` |
| **calculer** avec un compteur (texte → nombre) | `Number(texte)` |
| une valeur par défaut si `null` | `stored ?? 0` |

### Je réponds comment ?

```ts
res.status(201).json({ message: "..." });   // d'abord le code, puis le corps
res.set("X-Cache", "HIT");                  // un en-tête, AVANT la réponse
return;                                     // après chaque réponse d'erreur
```

### Dans quel ordre j'écris une route ?

1. les vigiles (401, 400) ;
2. l'élément existe ? (404) ;
3. l'action est possible ? (409) ;
4. **j'écris** (Redis) ;
5. **je réponds**.

---

## 2. Les codes HTTP

**La méthode :** connectée ? (**401**) → bien écrite ? (**400**) → existe ? (**404**) → possible maintenant ? (**409**) → tout va bien : lu **200**, créé **201**, supprimé sans réponse **204**.

| # | Requête | Code | Pourquoi |
| --- | --- | --- | --- |
| 1 | `GET /challenges` | 200 | lecture réussie, liste vide ou remplie |
| 2 | `GET /challenges/3` | 200 | le défi existe |
| 3 | `GET /challenges/999` | 404 | le défi n'existe pas |
| 4 | `GET /challenges/abc` | 400 | `abc` n'est pas un numéro : demande mal écrite |
| 5 | `POST /challenges` avec un défi valide | 201 | ressource créée |
| 6 | `POST /challenges` sans titre | 400 (ou 422) | il manque une donnée |
| 7 | `GET /challenges?category=inconnue` | 200 | la liste existe, elle est juste vide |
| 8 | `DELETE /challenges/3` | 204 No Content | supprimé, rien à renvoyer |
| 9 | `DELETE /challenges` | 405 | seul `GET` existe sur cette adresse |
| 10 | `GET /me` sans jeton | 401 | pas connectée |
| 11 | valider le même défi 2 fois le même jour | 409 | déjà fait |
| 12 | 6e tentative de connexion en une minute | 429 | trop de requêtes |

⚠️ Ligne 8 : dans une adresse, c'est **`/`**, jamais `\`.

**Les phrases à retenir :**
- **404 = UN élément cherché par son numéro.** Une recherche ou une liste vide = **200**.
- **400 = mal écrit.** **405 = mauvais verbe.**
- **401 = qui es-tu ?** **409 = déjà fait.** **403 = connectée, mais pas le droit.**

---

## 3. Les points de cours

### Express

- `next()` : passer au middleware ou à la route suivante.
- Un middleware qui n'appelle ni `next()` ni `res.json()` : la requête reste bloquée, le client attend.
- `res.locals` : existe seulement pendant **une** requête. Le middleware y range une information pour la route. Vidé à chaque nouvelle requête.
- Un middleware posé sur une route (`app.post("/challenges", requireApiKey, ...)`) ne protège **que cette route**.
- Les routes s'écrivent **au-dessus** du bloc du 404.

### Validation et DTO

- `{ "text": "" }` alors qu'il faut au moins 1 caractère → **400**.
- **Zod** vérifie les données envoyées par le client. Ce n'est **pas** le jeton.
- **DTO** : l'objet dans lequel je choisis les champs envoyés au client, seulement ceux dont il a besoin.
- `POST /users` renvoie : `id`, `email` (et éventuellement `createdAt`). **Jamais** le mot de passe.

### Sécurité

| Mot | Ce que c'est |
| --- | --- |
| **bcrypt** | **hache** le mot de passe, à sens unique : on ne peut pas le retrouver |
| **chiffrer** | réversible avec une clé, pas fait pour un mot de passe |
| **JWT** | le jeton donné à la connexion, rien à voir avec le stockage |

- **b**crypt pour la **b**ase · **J**WT pour le **J**eton.
- Un JWT = **header** · **payload** · **signature**. Il sert à prouver qu'on est connectée.
- Dans le payload : `sub` (l'id), `email`, `exp` (expiration), `iat` (création). **Jamais** de mot de passe.
- C'est la **signature** (avec le secret du serveur) qui garantit que le jeton n'a pas été modifié.
- ⚠️ `"60"` entre guillemets = **60 millisecondes** (pas 60 minutes). `60` sans guillemets = 60 **secondes**.
- ⚠️ L'en-tête du jeton : **`Authorization: Bearer <jeton>`** (le nom de l'en-tête, puis `Bearer`, un espace, le jeton).
- Même `401 Invalid credentials` pour un email inconnu et un mauvais mot de passe : pour qu'un pirate ne puisse pas savoir quels emails ont un compte. Avec deux messages différents, il testerait une liste d'emails.
- `requireAuth` pour une **personne** connectée. `requireApiKey` pour un **programme**, avec une clé fixe. L'énoncé décide toujours.

### Redis

- Redis range les données en **RAM** (mémoire). PostgreSQL, sur le disque.
- Adapté pour : un compteur de visites, un cache de réponses, une valeur qui s'efface au bout de 5 minutes. Pas pour garder des comptes pour toujours.
- `TTL` = **-2** : la clé n'existe pas (jamais créée, ou expirée). **-1** : la clé existe sans durée de vie, elle ne s'effacera jamais seule.
- Limiter `/login` : empêche un pirate d'essayer des milliers de mots de passe.
- L'IP dans la clé : compter les tentatives de **chaque** visiteur séparément.
- `res.set("X-Cache", ...)` = un en-tête de la réponse. `redis.set(...)` = une clé dans Redis.

### OpenAPI

- Décrit : l'adresse et le verbe de chaque route, les réponses possibles avec leur code, et si la route demande un jeton.
- Swagger ne montre **que** les routes écrites dans `openapi.yaml`.
- 2 espaces par niveau. `/challenges/{id}` dans OpenAPI = `/challenges/:id` dans Express.

---

## 4. Le code de référence (écrit de mémoire, corrigé)

### `requireApiKey`

```ts
const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers["x-api-key"] !== "secret123") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};

app.get("/admin", requireApiKey, (req, res) => {
  const response = "bienvenue admin";
  res.status(200).json({ message: response });
});
```

### `parseIdParam`

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

app.get("/items/:id", parseIdParam, (req, res) => {
  res.json({ id: res.locals.id });
});
```

### Le schéma Zod

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

⚠️ Dans mes notes : `RegisterShema` → **`RegisterSchema`** (avec un **c**), et `z.string.().ming(8)` → **`z.string().min(8)`** (les parenthèses juste après `string`, et `min` sans **g**).

### Le jeton, à la fin de `/login`

```ts
const JWT_SECRET = "your_jwt_secret";

const token = jwt.sign(
  { sub: String(existingUser.id), email: existingUser.email },
  JWT_SECRET,
  { expiresIn: 3600 },
);
res.status(200).json({ accessToken: token, tokenType: "Bearer", expiresIn: 3600 });
```

### `requireAuth`

```ts
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token!, JWT_SECRET);
    res.locals.user = payload;
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  next();
};
```

### Le compteur de visites

```ts
app.get("/visits", async (req, res) => {
  const visits = await redis.incr("visits");
  res.json({ message: "merci pour les visites", visits });
});
```

### Le cache

```ts
app.get("/notes", async (req, res) => {
  const cached = await redis.get("cache:notes");
  if (cached) {
    res.set("X-Cache", "HIT");
    res.json({ message: "La liste des notes est:", notes: JSON.parse(cached) });
    return;
  }

  res.set("X-Cache", "MISS");
  await redis.set("cache:notes", JSON.stringify(notes), "EX", 60);
  res.json({ message: "La liste des notes est:", notes: notes });
});
```

Quand les notes changent (`POST /notes`) : `await redis.del("cache:notes");` juste après l'ajout.

### `limitLogin`

```ts
const limitLogin = async (req: Request, res: Response, next: NextFunction) => {
  const key = `ratelimit:login:${req.ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60);
  }

  if (count > 5) {
    const ttl = await redis.ttl(key);
    res.set("Retry-After", String(ttl));
    res.status(429).json({ error: "Too many requests" });
    return;
  }
  next();
};
```

---

## 5. Mes fautes d'écriture à surveiller

| Ce que j'ai écrit | Ce qu'il faut | La règle |
| --- | --- | --- |
| `req:ip`, `notes.JSON.parse` | `req.ip`, `notes: JSON.parse` | **`.`** = « dans » · **`:`** = « étiquette : valeur » |
| `String:(...)` | `String(...)` | une fonction s'appelle avec les parenthèses directement |
| `cont`, `redit`, `NexFunction`, `parseIdParm`, `isInterger` | `const`, `redis`, `NextFunction`, `parseIdParam`, `isInteger` | relire chaque nom **lettre par lettre** |
| `ExistingUser`, `challengeID`, `totalpoints` | `existingUser`, `challengeId`, `totalPoints` | une majuscule change le nom |
| `HIT` sans guillemets | `"HIT"` | un **texte** prend des guillemets |
| `")})` | `"})` | fermer **`}`** puis **`)`** puis **`;`** |
| `}` à la fin d'une route | `});` | fermer la fonction **et** `app.get(` |
| `return` hors du `if` | `return` dans le `if` | juste après la réponse d'erreur |
| `res.json.status(200)` | `res.status(200).json(...)` | d'abord le code, puis le corps |
| `app.get("visit", ...)` | `app.get("/visit", ...)` | une adresse commence par `/` |