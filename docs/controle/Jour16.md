# Jour 16 - Choisir la taille du classement (`?limit=`)

- **Objet :** séance mixte : 4 QCU, une chasse aux bugs, une amélioration de `GET /leaderboard`, et sa documentation.
- **Durée :** 30 min (3 min de QCU + 5 min de lecture de code + 15 min de code + 7 min de YAML).
- **Modalités :** les QCU et la lecture de code se font **sans** les fiches. Pour le code et le YAML, suis le plan, une étape à la fois, et teste après chacune.
- **Projet :** `~/projets/entrainement-partiel`.

---

## Section 0 - Échauffement (3 min - 4 pts)

**Q0.1 (QCU, 1 pt)** Dans une route, où se place la réponse `res.status(200).json(liste)` quand une boucle `for` fabrique la liste ?

- a) à l'intérieur de la boucle, pour répondre à chaque tour
- b) après l'accolade qui ferme la boucle, une seule fois
- c) avant la boucle
- d) n'importe où

**Q0.2 (QCU, 1 pt)** Une route **sans vigile** se documente :

- a) avec `security: - bearerAuth: []` et une réponse 401
- b) sans `security`, et sans réponse 401
- c) avec `security`, mais sans 401
- d) avec une réponse 401, mais sans `security`

**Q0.3 (QCU, 1 pt)** Dans `GET /leaderboard?limit=5`, comment lit-on `5` ?

- a) `req.params.limit`
- b) `req.body.limit`
- c) `req.query.limit`
- d) `req.headers.limit`

**Q0.4 (QCU, 1 pt)** Quelle affirmation est **fausse** ?

- a) `req.query.limit` est toujours un texte (ou `undefined`)
- b) `Number("5")` donne le nombre 5
- c) `req.query.limit` est directement un nombre
- d) `Number("abc")` ne donne pas un vrai nombre

---

## Section 1 - Chasse aux bugs (5 min - 4 pts)

**Q1.1 (Lecture de code, 4 pts)**

```ts
app.get("/leaderboard", requireAuth, async (req, res) => {
  const raw = await redis.zrevrange("leaderboard", 0, 2);
  const ranking = [];
  for (let i = 0; i < raw.length; i = i + 1) {
    ranking.push({ userId: raw[i], points: raw[i + 1] });
    res.json(ranking);
  }
});
```

Le classement doit être **public**, renvoyer les 3 premières **avec leurs points en nombre**. Trouve les **quatre** erreurs.

> **Erreur 1 :** _(écris ta réponse ici)_
>
> **Erreur 2 :** _(écris ta réponse ici)_
>
> **Erreur 3 :** _(écris ta réponse ici)_
>
> **Erreur 4 :** _(écris ta réponse ici)_

**Indice :** regarde le vigile, les arguments de `zrevrange`, la boucle (son pas, et ce qu'il y a dedans), et le type des points.

---

## Section 2 - Le classement de taille variable (15 min - 8 pts) `[CP3, CP8]`

**Le but :** le client choisit combien d'utilisatrices il veut voir.

- `GET /leaderboard` → les **3** premières (comme avant) ;
- `GET /leaderboard?limit=5` → les **5** premières ;
- `?limit=abc`, `?limit=0` ou `?limit=50` → **400** `{ "error": "limit must be between 1 and 10" }`.

### Étape 1 - Corriger la boucle d'hier (1 pt)

Si ce n'est pas déjà fait : dans ta route `GET /leaderboard`, la réponse doit être **après** l'accolade qui ferme la boucle, et elle renvoie `ranking`.

### Étape 2 - Lire le filtre (2 pts)

Au début de la route, lis `req.query.limit`, transforme-le en nombre, et mets **3** si le client n'a rien envoyé.

**Aide :**

```ts
const limit = Number(req.query.limit ?? 3);
```

- `req.query.limit ?? 3` : la valeur envoyée, **sinon** 3 ;
- `Number(...)` : `"5"` devient `5`.

Ajoute un `console.log(limit);` et teste avec et sans `?limit=5`.

### Étape 3 - Refuser une mauvaise valeur (3 pts)

Si `limit` n'est **pas un entier**, ou s'il est **plus petit que 1**, ou **plus grand que 10** → **400**, puis `return`.

**Indice :** c'est la même condition que ton vigile `parseIdParam`, avec une borne en plus. Rappel : `||` veut dire « ou ».

```ts
// écris ton code ici
```

### Étape 4 - Utiliser la limite (2 pts)

Dans `zrevrange`, la fin n'est plus `2`. Pour obtenir `limit` utilisatrices, les positions vont de `0` à `limit - 1`.

```ts
// écris ta route complète ici
```

**Tests :**

```bash
curl http://localhost:3000/leaderboard
curl "http://localhost:3000/leaderboard?limit=1"
curl -i "http://localhost:3000/leaderboard?limit=abc"
curl -i "http://localhost:3000/leaderboard?limit=50"
```

Attendu : les 3 premières ; la première seulement ; puis deux **400**.

Les guillemets autour de l'adresse sont nécessaires quand elle contient un `?`.

---

## Section 3 - Documenter le paramètre `limit` (7 min - 4 pts) `[CP3]`

Dans ton bloc `/leaderboard:` de `openapi.yaml`, ajoute :

1. un **paramètre** `limit`, qui se trouve **après le `?`** (et pas dans le chemin) ;
2. la réponse **400**.

**Aide :** un paramètre de chemin s'écrit `in: path`. Un paramètre après le `?` s'écrit **`in: query`**. Et comme le client peut **ne pas** l'envoyer, il n'est **pas** obligatoire.

```yaml
      parameters:
        - name: limit
          in: ?
          required: ?
          schema:
            type: integer
            example: 3
```

```yaml
# écris ton bloc /leaderboard complet ici
```

Puis **redémarre** le serveur. Dans Swagger, **Try it out** doit afficher une case `limit`, **facultative**.

---

*Fin du jour 16 (20 pts). Envoie-moi ta copie : on corrige ensemble.*