# Jour 13 - Séance spéciale QCU (CORRIGÉ)

- **Ma note :** 12 / 15 (16 / 20), ma meilleure note sur les QCU.
- **Acquis depuis hier :** l'ordre **V.E.R.**, `JSON.parse`, le 204, `{id}` dans OpenAPI, les millisecondes.
- **Le seul piège qui résiste :** `res.set` / `redis.set`.
- **Nouveau réflexe :** dans une consigne, je repère les mots **« faux »**, **« pas »**, **« sauf »** avant de répondre.

---

## Section 1 - Les codes (3 / 4)

**Q1.1** `DELETE /notes/3` réussi, sans corps → **c) 204 No Content** ✅

**Q1.2** `GET /notes?text=bonjour` sans résultat → **a) 200 OK, avec `[]`** ✅

**Q1.3** Quel couple chiffre / nom est **faux** ?

- b) 200 No Content

❌ J'avais gardé **d) 405 Method Not Allowed**, qui est un couple **juste**. La question demandait le couple **faux** : 200 s'appelle « OK », et « No Content » est le nom du **204**.

**Q1.4** Valider deux fois le même défi le même jour → **c) 409** ✅

---

## Section 2 - L'ordre (3 / 3)

**Q2.1** → **c) vérifier, écrire, répondre** ✅ 🎉 (après quatre erreurs)

**Q2.2** → **c) après le 409, juste avant la réponse 201** ✅

**Q2.3** Le mot qui arrête la route après une erreur → **`return`** ✅

---

## Section 3 - Redis et JSON (3 / 4)

**Q3.1** Ranger une liste → **b) `JSON.stringify(liste)`** ✅

**Q3.2** Relire une liste → **a) `JSON.parse(cached)`** ✅ 🎉

**Q3.3** Où Redis garde ses données → **b) en RAM** ✅

**Q3.4** Ajouter un en-tête à la réponse :

- b) `res.set("X-Cache", "HIT")`

❌ J'avais mis `redis.set` (3e fois).

| Ligne | Ce qu'elle fait | Qui la voit |
| --- | --- | --- |
| `res.set("X-Cache", "HIT")` | ajoute un **en-tête** à la **rés**ponse | le **client** (avec `curl -i`) |
| `redis.set("cache:notes", ...)` | range une **clé** dans **Redis** | personne, sauf mon code |

---

## Section 4 - Syntaxe (3 / 4)

**Q4.1** Express `/notes/:id` → OpenAPI → **c) `/notes/{id}`** ✅

**Q4.2** OpenAPI `/users/{id}/points` → Express :

- b) `/users/:id/points`

❌ J'avais gardé les accolades. Ici, on allait dans l'autre sens : **vers Express**, donc les **deux-points**. « Express pressé `:` » marche dans les deux sens.

**Q4.3** `expiresIn: "60"` → **c) 60 millisecondes** ✅

**Q4.4** La liste des erreurs de Zod → **b) `{ errors: result.error.issues }`** ✅