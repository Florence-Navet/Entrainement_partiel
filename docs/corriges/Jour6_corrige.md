# Jour 6 - Limiter les tentatives (429) et documenter l'API (CORRIGÉ)

- **Ma note :** 23 / 35 (13,1 / 20), ma meilleure note jusqu'ici.
- **Les quatre phrases à apprendre par cœur avant le partiel :**
  1. **Redis garde tout en mémoire (RAM)**, pas sur le disque.
  2. **`res.set`** ajoute un **en-tête à la réponse**. **`redis.set`** range une **clé dans Redis**.
  3. **`"60"` entre guillemets = 60 millisecondes.** Sans guillemets : 60 secondes.
  4. **`TTL` = `-2`** : la clé n'existe pas. **`-1`** : elle existe, sans durée de vie.

---

## Section 0 - Révision ciblée (3 / 8)

**Q0.1** Pour enregistrer un mot de passe → **b) un hash bcrypt** ✅ 🎉 (enfin, après quatre jours)

**Q0.2** À quoi sert un JWT → **b) à prouver qu'on s'est connecté, à chaque requête suivante** ✅

**Q0.3** `expiresIn: "60"`, avec des guillemets :

- c) 60 millisecondes

❌ J'avais mis 60 minutes. Avec des guillemets, le nombre est lu comme un texte, et un texte sans unité veut dire **millisecondes**. C'est le bug du jour 4 : mon jeton durait 3 secondes.

**Q0.4** Où Redis garde-t-il ses données ?

- b) en mémoire (RAM)

❌ J'avais encore mis « sur le disque » (2e fois). C'est **la** différence avec PostgreSQL.

**Q0.5** Ajouter l'en-tête `X-Cache: HIT` à la réponse :

- b) `res.set("X-Cache", "HIT")`

❌ J'avais mis `redis.set` (2e fois). Pourtant, dans mon vigile, j'ai bien écrit `res.set("Retry-After", ...)`. Un en-tête appartient à la **réponse** (`res`), pas à Redis.

**Q0.6** Ce qu'on relit avec `redis.get` :

> **Réponse :** un **texte**. On le retransforme en liste avec `JSON.parse(...)`.

✅

**Q0.7** `TTL` = `-2`, et `-1` ?

> **Réponse :** `-2` : la clé **n'existe pas** (jamais créée, ou déjà expirée). `-1` : la clé **existe**, mais **sans** durée de vie : elle ne s'effacera jamais toute seule.

❌ J'avais répondu « -2 c'est un hit et -1 un miss ». HIT et MISS sont des en-têtes de **ma** route, ils n'ont rien à voir avec `TTL`.

---

## Section 1 - Comprendre (5 / 6)

**Q1.1** 429 → **b) trop de requêtes en peu de temps** ✅

**Q1.2** Pourquoi limiter `/login` → **b) pour empêcher un pirate d'essayer des milliers de mots de passe** ✅

**Q1.3** Pourquoi l'IP dans la clé → **a) pour compter les tentatives de chaque visiteur séparément** ✅

**Q1.4** Dans une documentation OpenAPI :

- a) les adresses et verbes des routes
- b) les réponses possibles avec leurs codes
- d) si une route demande un jeton

⚠️ J'avais oublié **d)**. C'est justement le cadenas et le `security: - bearerAuth: []` de l'étape 4.

**Q1.5** Swagger UI → **b) une page web qui affiche la documentation et permet de tester les routes** ✅

---

## Section 2 - Lire du code (3 / 5)

```ts
const limitLogin = async (req: Request, res: Response, next: NextFunction) => {
  const key = "ratelimit:login";
  const count = await redis.incr(key);
  	if(count === 1) {
		await redis.expire(key, 60);
	}

  if (count > 5) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }
  next();
};
```

> **Réponse a) :** tous les visiteurs partagent **le même compteur**. Dès que 5 tentatives sont faites au total, par n'importe qui, **tout le monde** est bloqué, même ceux qui ne se sont jamais trompés.
>
> **Réponse b) :** sans `expire`, la clé **ne s'efface jamais** (`TTL` = `-1`). Après 5 tentatives, le compteur reste au-dessus de 5 **pour toujours** : la connexion est bloquée définitivement, même une heure plus tard.
>
> **Réponse c) :** `Retry-After` dit au client **combien de secondes attendre** avant de réessayer. Une appli peut afficher « Réessayez dans 42 secondes ».

⚠️ J'avais les bonnes idées, mais pas assez précises : a) « problème de connexion » ne dit pas que **tout le monde** est bloqué ; b) « la clé est toujours valable » ne dit pas que le blocage devient **définitif**.

---

## Section 3 - Code guidé (12 / 16)

### Q3.1 - Le vigile `limitLogin` (7 / 8)

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

app.post("/login", limitLogin, async (req, res) => {
  // ...la route du jour 4, inchangée
});
```

⚠️ Mon vigile marchait (cinq 401, puis deux 429, et `Retry-After: 60`). Il manquait seulement le message exact : `"Too many requests"`.

Ce que j'ai appris en l'écrivant :
- `Retry-After` va **dans** le `if (count > 5)`, **avant** le `res.status(429)` : une fois la réponse partie, on ne peut plus y ajouter d'en-tête ;
- sa valeur est le **temps restant** (`redis.ttl`), pas un 60 écrit en dur ;
- `res.set` attend du **texte** : `String(ttl)` ;
- un nom qui dit ce que fait le vigile (`limitLogin`) est plus lisible que `vigile`.

Les tests :

```bash
for i in 1 2 3 4 5 6 7; do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"email":"lea@ecoda.fr","password":"faux"}'; done
```

Résultat obtenu : `401 401 401 401 401 429 429`. Une minute plus tard : de nouveau des 401.

### Q3.2 - Swagger UI (5 / 8)

**En haut de `app.ts` :**

```ts
import fs from "fs";
import YAML from "yaml";
import swaggerUi from "swagger-ui-express";
```

**Juste après `app.use(express.json());` :**

```ts
const openapiDocument = YAML.parse(fs.readFileSync("openapi.yaml", "utf8"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
```

**Le fichier `openapi.yaml` complet, à la racine du projet :**

```yaml
openapi: 3.0.3
info:
  title: API d'entraînement
  version: 1.0.0
paths:
  /ping:
    get:
      summary: Vérifier que l'API répond
      responses:
        "200":
          description: L'API répond pong
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: pong
  /login:
    post:
      summary: Se connecter à l'API
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  example: lea@ecoda.fr
                password:
                  type: string
                  example: secret123
      responses:
        "200":
          description: Connexion réussie, jeton renvoyé
          content:
            application/json:
              schema:
                type: object
                properties:
                  accessToken:
                    type: string
                  tokenType:
                    type: string
                    example: Bearer
                  expiresIn:
                    type: integer
                    example: 3600
        "401":
          description: Identifiants invalides
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid credentials
        "429":
          description: Trop de tentatives de connexion
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Too many requests
  /me:
    get:
      summary: Voir l'utilisateur connecté
      security:
        - bearerAuth: []
      responses:
        "200":
          description: L'utilisateur lu dans le jeton
        "401":
          description: Jeton absent ou invalide
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
```

⚠️ Ce qui marchait : la page `/docs`, `/ping` testé depuis le navigateur, `/login` documenté avec son corps et ses trois réponses. Ce qui manquait :
- **l'étape 4** : la route `/me`, la section `components` et le `security` (le cadenas et le bouton **Authorize**) ;
- la réponse `"200"` de `/login` décrivait encore `message: connected`, alors que la route renvoie le **jeton** depuis le jour 4.

---

## Les pièges rencontrés pendant la séance

- **`ERR_CONNECTION_REFUSED`** dans le navigateur = l'API ne tourne pas (comme `Couldn't connect to server` avec `curl`). Regarder le terminal de `npm run dev` pour voir pourquoi elle s'est arrêtée.
- **`ENOENT: no such file or directory, open 'openapi.yaml'`** : le fichier n'est pas à la **racine** du projet (au même niveau que `package.json`), ou son nom est mal écrit (`.yml` au lieu de `.yaml`).
- **`/login` n'apparaissait pas dans Swagger** : il avait 4 espaces au lieu de 2, donc YAML le rangeait **à l'intérieur** de `/ping`. Chaque niveau = 2 espaces. Dans VS Code, **Shift + Tab** recule un bloc sélectionné d'un cran.
- **Le 401 au lieu du 429** : plus d'une minute était passée, le compteur s'était remis à zéro. Pour tester le 429, enchaîner plus de 5 tentatives.
- **`Retry-After: 60`** : normal si toutes les tentatives tombent dans la même seconde. Quelques secondes plus tard, le nombre baisse.

## À corriger encore dans `app.ts`

- `accesToken` → **`accessToken`** (avec deux `s`), dans `/login` ;
- `"Too many login attempts"` → **`"Too many requests"`**, dans `limitLogin`.