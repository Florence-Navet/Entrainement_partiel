# Jour 17 - Ma place dans le classement (`GET /me/rank`)

- **Objet :** séance mixte : 4 QCU, une chasse aux bugs dans le YAML, une nouvelle route dans le projet, et sa documentation.
- **Durée :** 30 min (3 min de QCU + 5 min de lecture + 15 min de code + 7 min de YAML).
- **Modalités :** les QCU et la chasse aux bugs se font **sans** les fiches. Pour chaque QCU, **relis la question une deuxième fois** avant de répondre. Pour le code et le YAML, suis le plan, une étape à la fois, et teste après chacune.
- **Projet :** `~/projets/entrainement-partiel`.

---

## Section 0 - Échauffement (3 min - 4 pts)

**Q0.1 (QCU, 1 pt)** Quelle ligne ajoute l'en-tête `X-Cache` à la **réponse** ?

- 
- b) `res.set("X-Cache", "HIT")`



**Q0.2 (QCU, 1 pt)** La route OpenAPI `/users/{id}/points` s'écrit, dans Express :

- a) `/users/{id}/points`


**Q0.3 (QCU, 1 pt)** `GET /leaderboard` est **public**. Dans le code, on écrit :


- b) `app.get("/leaderboard", async (req, res) => { ... })`



**Q0.4 (QCU, 1 pt)** Quel couple chiffre / nom est **faux** ?

- a) 204 No Content


---

## L'essentiel à retenir (5 min)

### Deux nouvelles commandes de l'ensemble trié

| Je veux… | Commande | Renvoie |
| --- | --- | --- |
| la **position** d'un membre, du plus grand au plus petit | `await redis.zrevrank("leaderboard", "1")` | un nombre (`0` = premier), ou `null` |
| le **score** d'un membre | `await redis.zscore("leaderboard", "1")` | le score **en texte**, ou `null` |

- `zrevrank` compte à partir de **0** : la première a la position `0`, la deuxième la position `1`…
- Pour afficher une place « humaine » (1re, 2e…), on fait `position + 1`.
- Si le membre n'est **pas** dans le classement, les deux commandes renvoient `null`.

### Le piège : `0` n'est pas `null`

```ts
if (!position) { ... }        // ❌ la première (position 0) est rejetée aussi
if (position === null) { ... } // ✅ seul « pas dans le classement » est rejeté
```

`!0` vaut `true` : avec `!position`, la meilleure utilisatrice recevrait un 404.

---

## Section 1 - Chasse aux bugs dans le YAML (5 min - 4 pts)

**Q1.1 (Lecture de code, 4 pts)**

```yaml
  /challenges/:id:
    patch:
      summary: Modifier les points d'un défi
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: query
          required: false
          schema:
          type: integer
      responses:
        "200":
          description: Défi modifié
```

Trouve les **quatre** erreurs.

> **Erreur 1 :**"204"
>
> **Erreur 2 :** in: path
>
> **Erreur 3 :** required: true
>
> **Erreur 4 :**/challenges/{id}:

**Indice :** regarde la façon d'écrire le chemin, l'endroit où se trouve l'id, s'il est obligatoire, et les espaces sous `schema:`.

Quand c'est fait : ouvre **ton** `openapi.yaml` et vérifie tes blocs `/challenges/{id}`.

---

## Section 2 - Ma place dans le classement (15 min - 8 pts) `[CP3, CP8]`

**Le but :**

- sans jeton → **401** ;
- l'utilisatrice n'a encore validé aucun défi → **404** `{ "error": "Not in leaderboard" }` ;
- sinon → **200** `{ "rank": 1, "points": 30 }`.

> Où écrire : à côté de `GET /me/points`, au-dessus du bloc du 404.

### Étape 1 - La coquille (2 pts)

Écris `GET /me/rank`, avec le vigile qui vérifie le jeton, `async`, et pour l'instant une réponse **200** `{ "message": "ok" }`.

```ts
app.get("/me/rank", requireAuth, async(req,res) => {
  const response = "Message : ok";
      res.json({ message: response, user: res.locals.user });
});
```

**Test :**

```bash
curl -i http://localhost:3000/me/rank
curl -i http://localhost:3000/me/rank -H "Authorization: Bearer $TOKEN"
```

Attendu : **401**, puis **200** `ok`.

### Étape 2 - Lire la position (2 pts)

Au début de la route, récupère `userId` (comme dans `GET /me/points`), puis lis sa position avec `redis.zrevrank`, dans une variable `position`. Ajoute un `console.log(position);`.

```ts
app.get("/me/rank", requireAuth, async(req,res) => {

  const userId = res.locals.user.sub;
  const position = await redis.zrevrank("Leaderboard",userId);
  console.log(position);
  const response = "Message : ok";
      res.json({ message: response, user: res.locals.user });
});
```

**Test :** avec un compte qui a validé un défi, puis avec un compte tout neuf. Regarde le terminal de `npm run dev` : un nombre, puis `null`.

### Étape 3 - Refuser si absente (2 pts)

Si `position` vaut `null` → **404** `{ "error": "Not in leaderboard" }`, puis `return`.

**Attention :** relis le piège de l'essentiel avant d'écrire la condition.

```ts

  const userId = res.locals.user.sub;
  const position = await redis.zrevrank("Leaderboard",userId);
  console.log(position);
  if (position === null){
    res.status(404).json({error:"Not in leaderboard"});
    return;
  }
  const response = "Message : ok";
      res.json({ message: response, user: res.locals.user });
});
```

### Étape 4 - Lire le score, puis répondre (2 pts)

Lis le score avec `redis.zscore`, puis réponds **200** avec :

- `rank` : la place « humaine » (pas la position qui commence à 0) ;
- `points` : le score **en nombre**.

```ts

app.get("/me/rank", requireAuth, async (req, res) => {
  const userId = res.locals.user.sub;
  const position = await redis.zrevrank("leaderboard", userId);
  console.log(position);
  if (position === null) {
    res.status(404).json({ error: "Not in leaderboard" });
    return;
  }
  const score = await redis.zscore("leaderboard", userId);
  console.log(score);
  const response = "Message : ok";
  res.json({ message: response, user: res.locals.user });
});
```

**Test :**

```bash
curl -i http://localhost:3000/me/rank -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/leaderboard
```

Attendu : ta place et tes points, les mêmes que dans le classement.

---

## Section 3 - Documenter la route (7 min - 4 pts) `[CP3]`

Dans `openapi.yaml`, ajoute `GET /me/rank`.

**Le plan :** je relis ma route, ligne par ligne :

1. le chemin et le verbe ;
2. un `summary` ;
3. un vigile ? → si oui, `security` **et** la réponse 401 ;
4. un paramètre dans l'adresse ? un corps ? ;
5. une réponse pour chaque `res.status(...)`.

Bonus : décris le contenu de la réponse `"200"` (un objet avec `rank` et `points`, deux entiers).

```yaml
  /me/rank:
    get:
      summary: Voir mon rang
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Le rang de l'utilisateur connecté
        "401":
          description: Jeton absent ou invalide
```

Puis **redémarre** le serveur, et teste dans Swagger avec **Authorize**.

---

*Fin du jour 17 (20 pts). Envoie-moi ta copie : on corrige ensemble.*