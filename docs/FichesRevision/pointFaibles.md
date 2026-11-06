# Fiche de révision - Mes points faibles (EC04)

> À relire avant chaque séance, et le matin du partiel.

---

## 1. Choisir le bon code HTTP

### La méthode : je pose les questions dans l'ordre, je m'arrête au premier « non »

| Ordre | Question | Si non |
| --- | --- | --- |
| 1 | Suis-je connectée ? (si la route a `requireAuth`) | **401** |
| 2 | La demande est-elle bien écrite ? | **400** |
| 3 | L'élément demandé existe-t-il ? | **404** |
| 4 | L'action est-elle possible maintenant ? | **409** |
| 5 | Tout va bien → lu **200** · créé **201** · supprimé sans réponse **204** | |

### Chaque code avec un exemple Ecoda

| Code | Nom | Quand | Exemple |
| --- | --- | --- | --- |
| **200** | OK | lecture réussie, **même une liste vide** | `GET /challenges?category=sport` → `[]` |
| **201** | Created | création réussie | `POST /users` |
| **204** | No Content | suppression réussie, rien à renvoyer | `DELETE /notes/1` |
| **400** | Bad Request | demande mal écrite | `GET /challenges/abc` · mot de passe trop court |
| **401** | Unauthorized | pas de jeton, jeton faux, ou mauvais identifiants | `GET /me` sans `Authorization` |
| **403** | Forbidden | connectée, mais pas le droit | une utilisatrice qui modifie le compte d'une autre |
| **404** | Not Found | **UN** élément demandé par son numéro n'existe pas | `GET /challenges/999` |
| **405** | Method Not Allowed | l'adresse existe, mais **pas avec ce verbe** | `DELETE /challenges` |
| **409** | Conflict | demande valide, mais **déjà fait** | valider le même défi 2 fois le même jour |
| **429** | Too Many Requests | trop d'essais en peu de temps | 6e tentative de connexion en une minute |
| **500** | Internal Server Error | **le code a planté** | `req is not defined` |

### Les phrases à retenir

- **404 = UN élément, cherché par son numéro.** Une recherche ou une liste vide = **200**.
- **400 = mal écrit.** **405 = mauvais verbe.** Ce n'est pas la même chose.
- **401 = qui es-tu ?** **409 = déjà fait.**
- **2xx** : ça marche · **4xx** : la faute du client · **5xx** : la faute du serveur.

---

## 2. Sécurité

| Mot | Sert à | Retenir |
| --- | --- | --- |
| **bcrypt** | **hacher** le mot de passe avant de l'enregistrer | **b**crypt pour la **b**ase |
| **JWT** | prouver qu'on est connectée, à chaque requête | **J**WT pour le **J**eton |

- Un hash ne se « déchiffre » pas. À la connexion, on **compare** : `bcrypt.compare(motDePasse, hash)`.
- Le **payload** d'un JWT est **lisible par tout le monde**. Dedans : `sub`, `email`, `iat`, `exp`. **Jamais** de mot de passe, ni de hash.
- C'est la **signature** (calculée avec le secret du serveur) qui garantit que le jeton n'a pas été modifié.
- `expiresIn: 3600` (nombre) = 3600 **secondes**. `"3600"` (texte) = 3600 **millisecondes**.
- Même message `401 Invalid credentials` pour un email inconnu et un mauvais mot de passe : pour **ne pas** dire à un pirate quels comptes existent.
- Le jeton s'envoie dans l'en-tête : `Authorization: Bearer <jeton>`.

---

## 3. Express

- Express lit `app.ts` **de haut en bas**. Toutes les routes vont **au-dessus** du bloc du 404.
- Un middleware (vigile) reçoit **toujours** `(req, res, next)`, dans cet ordre.
- Il fait **soit** `next()`, **soit** une réponse suivie de **`return`**.
- Une route doit **toujours répondre** (`res.json(...)`), sinon le client attend.
- Un vigile posé sur une route (`app.get("/me", requireAuth, ...)`) ne protège **que cette route**.
- `res.locals` : passer une information du vigile à la route (`res.locals.id`, `res.locals.user`).
- `req` = **demande** reçue · `res` = **réponse** envoyée. Si je lis `req.params...`, j'écris `req`, pas `_req`.

### Où se trouve ce que le client envoie

| Le client l'a mis… | Je le lis avec |
| --- | --- |
| dans l'adresse : `/challenges/3` | `req.params.id` |
| après le `?` : `?category=carbone` | `req.query.category` |
| dans le corps (`-d '{...}'`) | `req.body.text` (avec `app.use(express.json())`) |
| dans un en-tête | `req.headers.authorization` |

---

## 4. Redis (avec ioredis)

- Redis garde tout **en mémoire (RAM)**. PostgreSQL garde tout **sur le disque**.
- Redis ne range que du **texte** : `JSON.stringify(liste)` pour ranger, `JSON.parse(texte)` pour relire.
- La **clé** est un **nom fixe** entre guillemets (`"cache:notes"`). La **valeur** change.

| Besoin | Commande |
| --- | --- |
| ranger | `await redis.set("cle", "valeur")` |
| ranger pour 60 s | `await redis.set("cle", "valeur", "EX", 60)` |
| lire | `await redis.get("cle")` → la valeur, ou `null` |
| ajouter 1 | `await redis.incr("cle")` |
| ajouter 20 | `await redis.incrby("cle", 20)` |
| supprimer | `await redis.del("cle")` |
| donner 60 s de vie | `await redis.expire("cle", 60)` |
| temps restant | `await redis.ttl("cle")` |

| `TTL` répond | Ça veut dire |
| --- | --- |
| un nombre positif | il reste ce nombre de secondes |
| `-1` | la clé existe, **sans** durée de vie |
| `-2` | la clé **n'existe pas** |

| Ligne | Agit sur |
| --- | --- |
| `res.set("X-Cache", "HIT")` | un **en-tête de la réponse** |
| `redis.set("cle", ...)` | une **clé dans Redis** |

**Le cache :** je lis la clé → si elle existe : `X-Cache: HIT`, je réponds avec, `return` → sinon : je range avec `"EX"`, `X-Cache: MISS`, je réponds. Quand les données changent : `redis.del` sur la clé.

**La limite de tentatives :** clé `ratelimit:login:<ip>` → `incr` → si 1 : `expire 60` → si plus de 5 : `ttl`, `res.set("Retry-After", ...)`, **429**, `return`.

---

## 5. OpenAPI et Swagger

- Swagger ne montre **que** les routes écrites dans `openapi.yaml`.
- En YAML, **2 espaces** par niveau. Toutes les routes sont **alignées** sous `paths:`.
- Un chemin s'écrit `/challenges/{id}` dans OpenAPI, et `/challenges/:id` dans Express.
- Route protégée : `security: - bearerAuth: []` + la section `components` en bas.
- Dans Swagger : `POST /login` → copier `accessToken` → **Authorize** → coller → **Authorize** → **Close**. Le cadenas se ferme 🔒.
- Pas de ligne `Authorization` dans le bloc Curl = le jeton n'a pas été donné à **Authorize**.

---

## 6. Le jour de l'examen

- **Je ne modifie jamais le code de l'énoncé.** Je réponds dans les blocs `> Réponse :`.
- **QCU** = une seule ligne doit rester.
- **Partie A : 45 minutes maximum.** Ensuite je passe à la partie B, même si tout n'est pas fini.
- **Bloquée plus de 3 minutes** sur une question papier, **10 minutes** sur une question de code : je passe à la suivante.
- **Partie B : j'écris d'abord la forme de chaque route** (verbe, adresse, vigiles, 404, réponse). Même incomplète, elle rapporte des points.
- **Je pars de ce que j'ai déjà écrit** : `requireAuth`, `parseIdParam`, le cache de `/notes`, l'annonce de 30 secondes, `limitLogin`.

#aller dans la console redis
```docker compose exec redis redis-cli```

puis faire  

```KEYS completed:*```  
  
puis  

  

```DEL completed:1:3:2026-11-06
DEL completed:1:1:2026-11-06
DEL points:1```

