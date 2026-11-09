# Jour 11 - Documenter la validation d'un défi dans Swagger (CORRIGÉ)

- **Ma note :** 9 / 20 (section 0 : 3 / 5 · section 1 : 5 / 15 · bonus : 1 / 2).
- **Ce qui marchait :** ma nouvelle route `POST /challenges` (créer un défi), et son affichage dans Swagger.
- **Ce qui manquait :** la documentation de `POST /challenges/{id}/complete`, la route demandée par l'exercice.
- **Ce que je retiens :**
  1. **Une route = un bloc** dans `openapi.yaml`. Deux routes différentes ne se mélangent jamais.
  2. Pour documenter une route, je **relis son code** : les vigiles donnent `security` et les erreurs, `:id` donne `parameters`, `req.body` donne `requestBody`, chaque `res.status(...)` donne une réponse.
  3. Toutes les réponses sont **alignées** sous `responses:`.
  4. **« Je vérifie, j'écris, je réponds. »**
  5. Après chaque modification de `openapi.yaml`, je **redémarre** le serveur.

---

## Section 0 - Révision (3 / 5)

**Q0.1** Ranger une liste dans Redis → **b) `JSON.stringify(liste)`** ✅

**Q0.2** Le bon ordre dans une route :

- c) vérifier, écrire dans Redis, répondre

❌ J'avais mis a) (3e fois). Si j'écris avant de vérifier, j'ajoute des points même quand je réponds 409. Si je réponds avant de vérifier, je ne peux plus répondre 409.

**Q0.3** Swagger n'affiche pas une route → **a) la route n'est pas dans `openapi.yaml`** ✅

**Q0.4** La route Express `/challenges/:id/complete` dans OpenAPI :

- b) `/challenges/{id}/complete`

❌ J'avais mis a). **`:id`** dans Express, **`{id}`** dans OpenAPI.

**Q0.5** Une route protégée répond 401 dans Swagger → **b) se connecter, puis coller le jeton dans Authorize** ✅

---

## Section 1 - La documentation (5 / 15)

### Le problème principal : deux routes mélangées

J'ai maintenant deux routes différentes dans `app.ts`. Chacune a son propre bloc :

| | `POST /challenges` | `POST /challenges/:id/complete` |
| --- | --- | --- |
| Ce qu'elle fait | **crée** un défi | **valide** un défi existant |
| `parameters` (id dans l'adresse) | non | **oui** |
| `requestBody` (données dans le corps) | **oui** : titre, catégorie, points | non |
| `security` (le cadenas) | non (pas de vigile) | **oui** (`requireAuth`) |
| Réponses | 201, 400 | 201, 400, 401, 404, 409 |

J'avais tout mis dans le bloc `/challenges` : le corps de la création, plus le paramètre `id`, le cadenas et les erreurs de la validation. Le chemin `/challenges/{id}/complete` n'existait pas. Je ne pouvais donc pas tester la validation dans Swagger (étape 5).

### Comment trouver ce qu'il faut documenter : je relis la route

```ts
app.post("/challenges/:id/complete", requireAuth, parseIdParam, async (req, res) => {
```

- `post` → **`post:`** ;
- `/challenges/:id/complete` → **`/challenges/{id}/complete:`** ;
- `:id` → **`parameters`**, avec `in: path` ;
- `requireAuth` → **`security: - bearerAuth: []`**, et une réponse **401** ;
- `parseIdParam` → une réponse **400** ;
- le `find` + `res.status(404)` → une réponse **404** ;
- le `redis.get(key)` + `res.status(409)` → une réponse **409** ;
- le `res.status(201)` final → une réponse **201** ;
- pas de `req.body` → **pas** de `requestBody`.

### Les autres erreurs

- **Les espaces** : `"404"` et `"409"` étaient de plus en plus décalés vers la droite. YAML les rangeait **à l'intérieur** du `"401"`. Toutes les réponses doivent commencer à la même colonne.
- **Le sens du 409** : j'avais écrit « too many requests ». Ça, c'est le **429**. Le **409**, c'est « **déjà validé aujourd'hui** ».
- **Le bonus** : `/me/points` avait **un** espace devant au lieu de **deux**.

Ce qui était juste : j'avais retrouvé les **trois codes** (401, 404, 409) en relisant ma route, et la syntaxe de `parameters` et de `security` était correcte. C'est leur **place** qui n'allait pas.

### Les trois blocs corrigés

Sous `paths:`, après `/me`, et avant `components:` :

```yaml
  /challenges:
    post:
      summary: Créer un nouveau défi
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                title:
                  type: string
                  example: Faire une randonnée
                category:
                  type: string
                  example: carbone
                points:
                  type: number
                  example: 30
      responses:
        "201":
          description: Défi créé
        "400":
          description: Données invalides
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
        "400":
          description: Id invalide
        "401":
          description: Jeton absent ou invalide
        "404":
          description: Défi introuvable
        "409":
          description: Défi déjà validé aujourd'hui
  /me/points:
    get:
      summary: Voir mon total de points
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Le total de points de l'utilisatrice connectée
        "401":
          description: Jeton absent ou invalide
```

### Le test dans Swagger (après avoir redémarré le serveur)

1. `POST /users` → 201 ;
2. `POST /login` → copier `accessToken` ;
3. **Authorize** → coller → Authorize → Close ;
4. `POST /challenges/{id}/complete` → id = 2 → Execute → **201** ;
5. Execute une deuxième fois → **409**.

---

## Ce que j'ai fait en plus : créer un défi

```ts
const ChallengeSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  points: z.number().positive(),
});

app.post("/challenges", async (req, res) => {
  const result = ChallengeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }

  const challenge = {
    id: challenges.length + 1,
    title: result.data.title,
    category: result.data.category,
    points: result.data.points,
  };
  challenges.push(challenge);
  await redis.del("cache:challenges");

  res.status(201).json({ message: "Challenge created", challenge });
});
```

Ce que j'ai appris en l'écrivant :
- l'**id** n'est pas dans le schéma : c'est la route qui le calcule, pas le client ;
- des données invalides → **400** (pas 401) ;
- **`errors`** au pluriel quand j'envoie la liste de Zod, **`error`** au singulier pour un seul message ;
- le **`redis.del`** va dans la route qui **modifie** les données, juste après la modification. Pas dans une autre route ;
- **Swagger décrit** une route, il ne la **crée** pas : sans `app.post("/challenges", ...)` dans `app.ts`, Swagger affichait la route mais répondait 404 ;
- `openapi.yaml` n'est lu **qu'au démarrage** : après l'avoir modifié, je redémarre le serveur ;
- **Échap** plutôt qu'**Entrée** sur une suggestion de VS Code, pour éviter les imports parasites (`import { id, is } from "zod/v4/locales"`).