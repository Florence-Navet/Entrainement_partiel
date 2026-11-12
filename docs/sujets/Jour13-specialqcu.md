# Jour 13 - Séance spéciale QCU

- **Objet :** ancrer les réponses qui résistent dans les QCU, alors que je les applique déjà dans mon code.
- **Durée :** 15 min (3 min de lecture + 12 min de questions).
- **Modalités :** lis d'abord « Mes moyens mnémotechniques », puis réponds **sans les regarder**. Pour chaque QCU, **relis la question une deuxième fois** avant de répondre.
- **Pas de code dans le projet aujourd'hui.**

---

## Comment remplir ce document

| Type de question | Comment répondre |
| --- | --- |
| **QCU** (une seule bonne réponse) | Supprime les lignes des propositions incorrectes. Il ne doit rester qu'**une seule** ligne. |
| **Ouverte** | Une phrase courte dans le bloc `> Réponse :`. |

---

## Mes moyens mnémotechniques (3 min)

| Piège | Moyen de m'en souvenir |
| --- | --- |
| suppression réussie, rien à renvoyer | **204** : le **0** au milieu = **rien** |
| recherche ou liste vide | **200** avec `[]` : il y a une réponse, juste vide |
| l'ordre dans une route | **V.E.R.** : **V**érifier, **É**crire, **R**épondre |
| ranger / relire dans Redis | **S**tringify = **S**tocker · **P**arse = **P**rendre |
| un paramètre dans l'adresse | **Express pressé `:id`** · **OpenAPI ouvert `{id}`** |
| `"3600"` entre guillemets | des **millisecondes** |
| Redis | en **RAM** |
| un en-tête de réponse | **`res.set`** (la **rés**ponse) · `redis.set` = une clé **dans Redis** |
| plusieurs erreurs (Zod) | **`errors`**, au pluriel |
| le mot qui arrête une route après une erreur | **`return`** |

Et toujours : **le chiffre et son nom ensemble** (204 No Content, 409 Conflict…).

---

## Section 1 - Les codes (4 pts)

**Q1.1 (QCU, 1 pt)** `DELETE /notes/3` a réussi. La réponse n'a pas de corps. Quel code ?

- a) 200 OK
- b) 201 Created
- c) 204 No Content
- d) 404 Not Found

**Q1.2 (QCU, 1 pt)** `GET /notes?text=bonjour` ne trouve aucune note. Quel code ?

- a) 200 OK, avec `[]`
- b) 204 No Content
- c) 400 Bad Request
- d) 404 Not Found

**Q1.3 (QCU, 1 pt)** Quel couple chiffre / nom est **faux** ?

- a) 201 Created
- b) 200 No Content
- c) 409 Conflict
- d) 405 Method Not Allowed

**Q1.4 (QCU, 1 pt)** Une utilisatrice connectée valide **deux fois** le même défi le même jour. Quel code au 2e essai ?

- a) 401
- b) 404
- c) 409
- d) 429

---

## Section 2 - L'ordre (3 pts)

**Q2.1 (QCU, 1 pt)** Le bon ordre dans une route :

- a) répondre, vérifier, écrire
- b) écrire, vérifier, répondre
- c) vérifier, écrire, répondre
- d) vérifier, répondre, écrire

**Q2.2 (QCU, 1 pt)** Dans `POST /challenges/:id/complete`, où place-t-on `redis.incrby(...)` ?

- a) tout au début, avant les vérifications
- b) entre le 404 et le 409
- c) après le 409, juste avant la réponse 201
- d) après la réponse 201

**Q2.3 (Ouverte, 1 pt)** Quel mot faut-il écrire juste après `res.status(404).json(...)`, pour que la route s'arrête ?

> **Réponse :** _(écris ta réponse ici)_

---

## Section 3 - Redis et JSON (4 pts)

**Q3.1 (QCU, 1 pt)** Pour **ranger** une liste dans Redis :

- a) `JSON.parse(liste)`
- b) `JSON.stringify(liste)`
- c) `Number(liste)`
- d) `res.json(liste)`

**Q3.2 (QCU, 1 pt)** Pour **relire** une liste depuis Redis :

- a) `JSON.parse(cached)`
- b) `JSON.stringify(cached)`
- c) `Number(cached)`
- d) rien, c'est déjà une liste

**Q3.3 (QCU, 1 pt)** Où Redis garde-t-il ses données ?

- a) sur le disque
- b) en RAM
- c) dans le `.env`
- d) dans le navigateur

**Q3.4 (QCU, 1 pt)** Quelle ligne ajoute un **en-tête** à la réponse ?

- a) `redis.set("X-Cache", "HIT")`
- b) `res.set("X-Cache", "HIT")`
- c) `res.json({ "X-Cache": "HIT" })`
- d) `req.set("X-Cache", "HIT")`

---

## Section 4 - Syntaxe (4 pts)

**Q4.1 (QCU, 1 pt)** La route Express `/notes/:id` s'écrit, dans OpenAPI :

- a) `/notes/:id`
- b) `/notes/id`
- c) `/notes/{id}`
- d) `/notes/[id]`

**Q4.2 (QCU, 1 pt)** La route OpenAPI `/users/{id}/points` s'écrit, dans Express :

- a) `/users/{id}/points`
- b) `/users/:id/points`
- c) `/users/id/points`
- d) `/users/$id/points`

**Q4.3 (QCU, 1 pt)** `{ expiresIn: "60" }`, avec des guillemets, donne un jeton valable :

- a) 60 secondes
- b) 60 minutes
- c) 60 millisecondes
- d) 60 heures

**Q4.4 (QCU, 1 pt)** Zod renvoie la liste de toutes les erreurs. Quelle réponse est la plus claire ?

- a) `{ error: result.error.issues }`
- b) `{ errors: result.error.issues }`
- c) `{ message: result.error.issues }`
- d) `{ result: result.error.issues }`

---

*Fin du jour 13 (15 pts). Envoie-moi ta copie : je la corrige tout de suite.*