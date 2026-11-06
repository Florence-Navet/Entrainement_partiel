# Jour 9 - Valider un défi, une fois par jour (le 409)

- **Objet :** séance d'entraînement n°9 pour le partiel EC04, au format des épreuves Markdown de CODA.
- **Durée :** 20 min (3 min de révision + 17 min de code guidé).
- **Modalités :** la section 0 se fait **sans regarder** la fiche de révision. Pour la section 1, suis les étapes, une à la fois, et teste après chacune.
- **Projet :** `~/projets/entrainement-partiel`, fichier `src/app.ts`. On reprend **B2** du sujet blanc.

---

## Section 0 - Révision des codes (3 min - 5 pts)

**Q0.1 (Tableau à compléter, 5 pts) `[CP3]`**
Déroule la méthode **dans l'ordre** : connectée ? → bien écrite ? → existe ? → possible maintenant ?

| # | Requête | Code |
| --- | --- | --- |
| 1 | `GET /challenges?category=sport` (aucun défi sport) |200 |
| 2 | `POST /challenges/3/complete` **sans** jeton |401 |
| 3 | `POST /challenges/abc/complete` avec jeton |204 |
| 4 | `POST /challenges/999/complete` avec jeton |404 |
| 5 | `POST /challenges/3/complete` avec jeton, **2e fois** aujourd'hui | 409|

---

## Section 1 - `POST /challenges/:id/complete` (17 min - 15 pts) `[CP3, CP8]`

**Le but :**
- sans jeton → **401** ;
- id mal écrit → **400** ;
- défi inexistant → **404** ;
- première validation du jour → **201** `{ "challengeId": 3, "points": 20, "totalPoints": 20 }` ;
- deuxième validation du même défi le même jour → **409** `{ "error": "Challenge already completed today" }`.

> **Où écrire la route :** au-dessus du bloc du 404, et **en dessous** de la définition de `requireAuth`. Un vigile doit être écrit **avant** la route qui l'utilise. Sinon : `Cannot access 'requireAuth' before initialization`.

**Avant de commencer :** crée un compte et récupère un jeton (`POST /users`, puis `POST /login`), avec `curl` ou dans Swagger. Garde le jeton sous la main.

---

### Étape 1 - La coquille (2 pts)

Écris la route `POST /challenges/:id/complete`, **`async`**, avec **deux vigiles** à la suite : `requireAuth`, puis `parseIdParam`. Pour l'instant, elle répond seulement **201** `{ "message": "ok" }`.

**Indice :** plusieurs vigiles se suivent, séparés par des virgules, entre l'adresse et la fonction.

```ts
// écris ton code ici
```

**Test :**

```bash
curl -i -X POST http://localhost:3000/challenges/3/complete
curl -i -X POST http://localhost:3000/challenges/abc/complete -H "Authorization: Bearer <jeton>"
curl -i -X POST http://localhost:3000/challenges/3/complete -H "Authorization: Bearer <jeton>"
```

Attendu : **401**, **400**, **201**. Les deux vigiles font déjà leur travail.

---

### Étape 2 - Le 404 (2 pts)

Cherche le défi dans `challenges` avec `res.locals.id`. S'il n'existe pas → **404** `{ "error": "Challenge not found" }`, puis `return`.

**Indice :** c'est exactement le début de ta route `GET /challenges/:id`.

```ts
// écris ton code ici
```

**Test :**

```bash
curl -i -X POST http://localhost:3000/challenges/999/complete -H "Authorization: Bearer <jeton>"
```

Attendu : **404**.

---

### Étape 3 - La clé « déjà fait aujourd'hui » (3 pts)

Prépare trois variables :
- **`userId`** : l'id de l'utilisatrice, dans `res.locals.user.sub` ;
- **`today`** : la date du jour, au format `2026-11-05` ;
- **`key`** : la clé Redis, au format `completed:<userId>:<id du défi>:<today>`.

**Aide pour la date :**

```ts
const today = new Date().toISOString().slice(0, 10);
```

- `new Date()` : maintenant ;
- `.toISOString()` : en texte, `2026-11-05T09:30:00.000Z` ;
- `.slice(0, 10)` : garde les 10 premiers caractères, `2026-11-05`.

**Indice pour la clé :** les backticks et `${...}`, comme `` `ratelimit:login:${req.ip}` ``.

Ajoute un `console.log(key);` pour voir la clé dans le terminal de `npm run dev`.

```ts
// écris ton code ici
```

**Test :** relance le `curl` avec le défi 3 et ton jeton. Dans le terminal de `npm run dev`, tu dois voir par exemple `completed:1:3:2026-11-05`.

---

### Étape 4 - Le 409 (3 pts)

Lis la clé avec `redis.get`. Si elle **existe déjà** → **409** `{ "error": "Challenge already completed today" }`, puis `return`.

**Indice :** c'est la même forme que ton `GET /announcement`, mais à l'envers : là, on répondait 404 quand la clé **n'existait pas**. Ici, on répond 409 quand elle **existe**.

```ts
// écris ton code ici
```

Pas encore de test : la clé n'est jamais écrite pour l'instant, donc le 409 ne peut pas arriver.

---

### Étape 5 - Écrire la clé pour 24 heures (2 pts)

Juste après le `if` du 409, range la clé dans Redis, avec la valeur `"1"`, pour **24 heures**.

**Indice :** 24 heures = 24 × 60 × 60 = **86400** secondes. Même forme que l'annonce de 30 secondes.

```ts
// écris ton code ici
```

**Test :**

```bash
curl -i -X POST http://localhost:3000/challenges/3/complete -H "Authorization: Bearer <jeton>"
curl -i -X POST http://localhost:3000/challenges/3/complete -H "Authorization: Bearer <jeton>"
```

Attendu : **201**, puis **409**. 🎉

Dans la console Redis : `KEYS completed:*`, puis `TTL` sur la clé affichée. Tu dois voir un nombre proche de 86400.

---

### Étape 6 - Les points (3 pts)

Avant de répondre :
- ajoute les points du défi au total de l'utilisatrice, avec `redis.incrby`, sous la clé `points:<userId>`. Range le résultat dans `totalPoints` ;
- réponds **201** avec `{ challengeId, points, totalPoints }`.

**Indice :** `redis.incrby(cle, 20)` ajoute 20 et renvoie le nouveau total. Ici, le nombre à ajouter est `challenge.points`.

```ts
// écris ton code ici
```

**Test :** pour repartir de zéro, supprime d'abord les clés dans la console Redis :

```
DEL points:1
KEYS completed:*
```

et `DEL` sur chaque clé `completed:...` affichée. Puis :

```bash
curl -i -X POST http://localhost:3000/challenges/3/complete -H "Authorization: Bearer <jeton>"
curl -i -X POST http://localhost:3000/challenges/1/complete -H "Authorization: Bearer <jeton>"
curl -i -X POST http://localhost:3000/challenges/3/complete -H "Authorization: Bearer <jeton>"
```

Attendu : **201** (total 20), **201** (total 30), **409**.

---

*Fin du jour 9 (20 pts). Envoie-moi ta route complète et ta section 0 : on corrige ensemble. Au jour 10 : `GET /me/points` et le cache du catalogue.*