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


- c) 204 No Content


**Q1.2 (QCU, 1 pt)** `GET /notes?text=bonjour` ne trouve aucune note. Quel code ?

- a) 200 OK, avec `[]`


**Q1.3 (QCU, 1 pt)** Quel couple chiffre / nom est **faux** ?



- d) 405 Method Not Allowed

**Q1.4 (QCU, 1 pt)** Une utilisatrice connectée valide **deux fois** le même défi le même jour. Quel code au 2e essai ?


- c) 409


---

## Section 2 - L'ordre (3 pts)

**Q2.1 (QCU, 1 pt)** Le bon ordre dans une route :


- c) vérifier, écrire, répondre


**Q2.2 (QCU, 1 pt)** Dans `POST /challenges/:id/complete`, où place-t-on `redis.incrby(...)` ?



- c) après le 409, juste avant la réponse 201


**Q2.3 (Ouverte, 1 pt)** Quel mot faut-il écrire juste après `res.status(404).json(...)`, pour que la route s'arrête ?

> **Réponse :** _(écris ta réponse ici)_
return;
---

## Section 3 - Redis et JSON (4 pts)

**Q3.1 (QCU, 1 pt)** Pour **ranger** une liste dans Redis :


- b) `JSON.stringify(liste)`


**Q3.2 (QCU, 1 pt)** Pour **relire** une liste depuis Redis :

- a) `JSON.parse(cached)`


**Q3.3 (QCU, 1 pt)** Où Redis garde-t-il ses données ?


- b) en RAM


**Q3.4 (QCU, 1 pt)** Quelle ligne ajoute un **en-tête** à la réponse ?

- a) `redis.set("X-Cache", "HIT")`


---

## Section 4 - Syntaxe (4 pts)

**Q4.1 (QCU, 1 pt)** La route Express `/notes/:id` s'écrit, dans OpenAPI :


- c) `/notes/{id}`
`

**Q4.2 (QCU, 1 pt)** La route OpenAPI `/users/{id}/points` s'écrit, dans Express :

- a) `/users/{id}/points`


**Q4.3 (QCU, 1 pt)** `{ expiresIn: "60" }`, avec des guillemets, donne un jeton valable :


- c) 60 millisecondes


**Q4.4 (QCU, 1 pt)** Zod renvoie la liste de toutes les erreurs. Quelle réponse est la plus claire ?


- b) `{ errors: result.error.issues }`


---

*Fin du jour 13 (15 pts). Envoie-moi ta copie : je la corrige tout de suite.*
