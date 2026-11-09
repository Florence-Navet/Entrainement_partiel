# Jour 12 - Deuxième sujet blanc (court)

- **Objet :** deuxième sujet blanc, plus court et **demi-guidé** : pas de rappel de cours, mais un **plan en étapes** pour chaque question de code.
- **Durée :** 45 min, chronométrée. Partie A : **20 min maximum**, puis je passe à la partie B, même si je n'ai pas fini.
- **Modalités :** sans documentation, sans recherche, sans IA, sans les fiches. Seuls mon projet et mon terminal sont autorisés pour la partie B. **Je ne modifie jamais le code de l'énoncé.**
- **Projet :** `~/projets/entrainement-partiel`. Avant de lancer le chrono : `docker compose up -d db redis`, puis `npm run dev`.

- **Heure de début :** _(à remplir)_ — **Heure de fin :** _(à remplir)_

| Partie | Thème | Durée | Points |
| --- | --- | --- | --- |
| A | Sur papier | 20 min | 20 |
| B | Dans le projet | 25 min | 20 |
| **Total** | | **45 min** | **40 pts** |

---

# Partie A - Sur papier (20 min - 20 pts)

**QA.1 (Tableau à compléter, 6 pts) `[CP3]`**
L'utilisatrice est connectée, sauf indication contraire. Le défi n°2 existe. Donne le code.

| # | Requête | Code |
| --- | --- | --- |
| 1 | `GET /challenges?category=eau` (aucun défi « eau ») | |
| 2 | `DELETE /challenges/2` réussi, rien à renvoyer | |
| 3 | `DELETE /challenges/abc` | |
| 4 | `DELETE /challenges/999` | |
| 5 | `DELETE /challenges/2` **sans** jeton | |
| 6 | `PUT /ping` (la route n'existe qu'en `GET`) | |

**QA.2 (QCU, 1 pt) `[CP3]`**
Le bon ordre dans une route :

- a) répondre, vérifier, écrire
- b) écrire, vérifier, répondre
- c) vérifier, écrire, répondre
- d) vérifier, répondre, écrire

**QA.3 (QCU, 1 pt) `[CP8]`**
Pour relire une liste rangée dans Redis avec `JSON.stringify` :

- a) `JSON.stringify(cached)`
- b) `JSON.parse(cached)`
- c) `Number(cached)`
- d) `res.json(cached)`

**QA.4 (QCU, 1 pt) `[CP8]`**
`{ expiresIn: "120" }`, avec des guillemets, donne un jeton valable :

- a) 120 secondes
- b) 120 minutes
- c) 120 millisecondes
- d) 2 heures

**QA.5 (QCU, 1 pt) `[CP3]`**
Dans OpenAPI, la route Express `/challenges/:id` s'écrit :

- a) `/challenges/:id`
- b) `/challenges/{id}`
- c) `/challenges/id`
- d) `/challenges/[id]`

**QA.6 (Lecture de code, 4 pts) `[CP3, CP8]`**

```ts
app.delete("/challenges/:id", parseIdParam, async (req, res) => {
  const index = challenges.findIndex((c) => c.id === res.locals.id);
  res.status(204).send();
  if (index === -1) {
    res.status(404).json({ error: "Challenge not found" });
  }
  challenges.splice(index, 1);
});
```

`findIndex` renvoie la **position** de l'élément dans la liste, ou `-1` s'il n'existe pas. `splice(index, 1)` retire l'élément à cette position.

a) Ce code a un problème d'**ordre**. Lequel, et que se passe-t-il pour un défi qui n'existe pas ?
b) Il manque un mot dans le `if`. Lequel ?
c) Après la suppression, le cache `cache:challenges` est périmé. Quelle ligne faut-il ajouter, et où ?

> **Réponse a) :** _(écris ta réponse ici)_
>
> **Réponse b) :** _(écris ta réponse ici)_
>
> **Réponse c) :** _(écris ta réponse ici)_

**QA.7 (Code papier, 6 pts) `[CP8]`**
Écris de mémoire le vigile `requireAuth` : 401 `Unauthorized` sans en-tête `Bearer`, 401 `Invalid token` si le jeton est faux, sinon l'utilisatrice dans `res.locals.user` puis `next()`.

```ts
// écris ton code ici
```

---

# Partie B - Dans le projet (25 min - 20 pts)

> Écris le code dans `src/app.ts`, au-dessus du bloc du 404 et **sous** `requireAuth` et `parseIdParam`. Teste avec `curl` après chaque étape, puis recopie ton code dans le bloc prévu.

### B1 - Supprimer un défi (12 pts) `[CP3, CP8]`

`DELETE /challenges/:id`, protégée par `requireAuth` :
- sans jeton → **401** ;
- id mal écrit → **400** ;
- défi inexistant → **404** `{ "error": "Challenge not found" }` ;
- sinon → le défi est retiré de la liste, le cache du catalogue est supprimé, et la route répond **204**, sans corps.

**Le plan :**

1. la coquille : verbe `delete`, l'adresse, les deux vigiles, `async`, et pour l'instant `res.status(204).send();` ;
2. chercher la **position** du défi avec `challenges.findIndex(...)`. Si elle vaut `-1` → 404 et `return` ;
3. retirer le défi avec `challenges.splice(index, 1)` ;
4. supprimer la clé `cache:challenges` dans Redis ;
5. répondre 204 avec `res.status(204).send()` (`send()` sans rien : pas de corps).

```ts
// recopie ton code ici
```

**Tests** (avec un jeton tout neuf) :

```bash
curl -i -X DELETE http://localhost:3000/challenges/2
curl -i -X DELETE http://localhost:3000/challenges/abc -H "Authorization: Bearer $TOKEN"
curl -i -X DELETE http://localhost:3000/challenges/999 -H "Authorization: Bearer $TOKEN"
curl -i -X DELETE http://localhost:3000/challenges/2 -H "Authorization: Bearer $TOKEN"
curl -i http://localhost:3000/challenges
```

Attendu : **401**, **400**, **404**, **204**, puis la liste **sans** le défi n°2 (et `X-Cache: MISS`).

### B2 - Documenter la suppression (8 pts) `[CP3]`

Dans `openapi.yaml`, documente `DELETE /challenges/{id}`.

**Le plan :** je relis ma route B1, ligne par ligne :

1. le **chemin**, avec des accolades ;
2. le **verbe** ;
3. un `summary` ;
4. le vigile `requireAuth` → ? ;
5. l'id dans l'adresse → ? ;
6. une réponse pour **chaque** `res.status(...)` possible, en comptant aussi ceux des deux vigiles.

**Attention :** une route existe déjà sous le chemin `/challenges/{id}`… ou pas ? Si **`GET /challenges/{id}`** n'est pas documentée, je crée le chemin. S'il existe déjà, j'ajoute `delete:` **sous le même chemin**, au même niveau que `get:`. Un chemin ne doit jamais apparaître **deux fois** (sinon : `DUPLICATE_KEY`).

Après l'avoir écrit : je **redémarre** le serveur, et je teste dans Swagger avec **Authorize**.

```yaml
# recopie ton bloc ici
```

---

*Fin du sujet blanc court. Note l'heure de fin, puis envoie-moi ta copie.*