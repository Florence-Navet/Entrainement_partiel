# Jour 11 - Documenter la validation d'un défi dans Swagger

- **Objet :** séance d'entraînement n°11 pour le partiel EC04, au format des épreuves Markdown de CODA.
- **Durée :** 20 min (3 min de révision + 17 min de documentation guidée).
- **Modalités :** la section 0 se fait **sans regarder** les fiches de révision. Pour la section 1, suis les étapes, une à la fois, et recharge Swagger après chacune.
- **Projet :** `~/projets/entrainement-partiel`, fichier `openapi.yaml` (à la racine). On reprend **B5** du sujet blanc.

---

## Section 0 - Révision (3 min - 5 pts)

**Q0.1 (QCU, 1 pt) `[CP8]`**
Pour **ranger** une liste dans Redis, on utilise :

- a) `JSON.parse(liste)`
- b) `JSON.stringify(liste)`
- c) `Number(liste)`
- d) rien, Redis range les listes telles quelles

**Q0.2 (QCU, 1 pt) `[CP3]`**
Dans une route, quel est le bon ordre ?

- a) écrire dans Redis, vérifier, répondre
- b) répondre, vérifier, écrire dans Redis
- c) vérifier, écrire dans Redis, répondre
- d) l'ordre n'a pas d'importance

**Q0.3 (QCU, 1 pt) `[CP3]`**
Swagger n'affiche pas une route qui existe pourtant dans `app.ts`. Pourquoi ?

- a) la route n'est pas dans `openapi.yaml`
- b) la route n'a pas de vigile
- c) Swagger ne montre que les `GET`
- d) il faut redémarrer Docker

**Q0.4 (QCU, 1 pt) `[CP3]`**
Dans OpenAPI, comment écrit-on la route Express `/challenges/:id/complete` ?

- a) `/challenges/:id/complete`
- b) `/challenges/{id}/complete`
- c) `/challenges/id/complete`
- d) `/challenges/$id/complete`

**Q0.5 (QCU, 1 pt) `[CP3]`**
Dans Swagger, une route protégée répond 401, et le bloc Curl n'a pas de ligne `Authorization`. Que faut-il faire ?

- a) écrire `Bearer` dans le corps de la requête
- b) se connecter avec `/login`, puis coller le jeton dans **Authorize**
- c) supprimer `security` dans `openapi.yaml`
- d) redémarrer le serveur

---

## Section 1 - Documenter `POST /challenges/{id}/complete` (17 min - 15 pts) `[CP3]`

> Rappels YAML : **2 espaces** par niveau, jamais de tabulation. Chaque route commence **exactement sous** `/ping:`, avec 2 espaces devant. Après chaque étape : enregistre, puis recharge **http://localhost:3000/docs** (F5).
>
> Si la page est vide ou si l'API s'arrête : regarde le terminal de `npm run dev`. Une erreur YAML y donne le **numéro de la ligne** fautive.

### Étape 1 - La route et son résumé (3 pts)

Sous `paths:`, après ta route `/me`, ajoute :
- le chemin, écrit **à la façon d'OpenAPI** (avec des accolades) ;
- le verbe `post:` ;
- un `summary:` : « Valider un défi pour aujourd'hui » ;
- une seule réponse pour l'instant : `"201"`, avec la description « Défi validé, points ajoutés ».

**Indice :** regarde comment est écrite ta route `/me` : le chemin, puis le verbe, puis `summary`, puis `responses`.

```yaml
# écris ton bloc ici
```

**Test :** recharge Swagger. La route `POST /challenges/{id}/complete` doit apparaître.

### Étape 2 - Le paramètre `id` (4 pts)

Swagger doit savoir que `{id}` est un nombre à remplir. Sous `post:`, au même niveau que `summary:`, ajoute :

```yaml
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
```

- `name: id` : le nom, le même que entre les accolades du chemin ;
- `in: path` : il se trouve **dans l'adresse** (comme `req.params.id`) ;
- `required: true` : obligatoire ;
- `type: integer` : un nombre entier.

**Test :** recharge Swagger, ouvre la route, clique sur **Try it out** : une case **id** doit apparaître.

### Étape 3 - Les autres réponses (4 pts)

Sous `responses:`, à côté de `"201"`, ajoute les trois autres codes que peut renvoyer ta route, chacun avec une `description` :

- `"401"` : ?
- `"404"` : ?
- `"409"` : ?

**Indice :** relis ta route `POST /challenges/:id/complete` dans `app.ts`, de haut en bas. Chaque `res.status(...)` correspond à une réponse à documenter. Et le 400 de `parseIdParam` ? Tu peux l'ajouter aussi, en bonus.

### Étape 4 - Le cadenas (2 pts)

La route est protégée par `requireAuth`. Sous `post:`, au même niveau que `summary:`, ajoute :

```yaml
      security:
        - bearerAuth: []
```

**Indice :** c'est exactement ce que tu as écrit pour `/me`.

**Test :** recharge Swagger. Un cadenas doit apparaître à droite de la route.

### Étape 5 - Le test complet dans Swagger (2 pts)

Tout dans le navigateur :
1. **`POST /users`** → Try it out → Execute → **201** ;
2. **`POST /login`** → Execute → copie le `accessToken` ;
3. **Authorize** → colle le jeton → **Authorize** → **Close** ;
4. **`POST /challenges/{id}/complete`** → Try it out → id = **2** → Execute → **201** ;
5. Execute une **deuxième** fois → **409**.

Si tu as déjà validé le défi 2 aujourd'hui, choisis un autre défi, ou supprime les clés `completed:*` dans la console Redis.

```yaml
# recopie ici ton bloc complet
```

---

### Bonus - Documenter `GET /me/points` (2 pts)

Ajoute la route `/me/points` : verbe `get:`, un `summary`, le cadenas, et les réponses `"200"` (le total de points) et `"401"`.

```yaml
# écris ton bloc ici
```

---

*Fin du jour 11 (20 pts + 2 bonus). Envoie-moi ton bloc YAML et ta section 0 : on corrige ensemble. Au jour 12 : un deuxième sujet blanc, plus court (45 minutes), pour vérifier que tu sais tout assembler seule.*