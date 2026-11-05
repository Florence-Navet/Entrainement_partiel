# Jour 2 - Les middlewares Express

- **Objet :** séance d'entraînement n°2 pour le partiel EC04, au format des épreuves Markdown de CODA.
- **Durée indicative :** 20 min (5 min de lecture + 15 min de questions)
- **Modalités :** lis d'abord « L'essentiel à retenir », puis réponds **sans regarder** cette partie.
- **Projet pour la partie code :** le projet ouvert dans ton éditeur **et** dans ton terminal (vérifie que c'est le même dossier), fichier `src/app.ts`

---

## Comment remplir ce document

| Type de question | Comment répondre |
| --- | --- |
| **QCU** (une seule bonne réponse) | Supprime les lignes des propositions incorrectes. Il ne doit rester qu'**une seule** ligne. |
| **QCM** (plusieurs réponses possibles) | Supprime les lignes des propositions incorrectes. Il reste uniquement les bonnes réponses. |
| **Ouverte** | Rédige ta réponse dans le bloc `> Réponse :` sous la question. |
| **Code** | Écris ton code dans le bloc de code prévu, puis teste-le dans le projet. |
| **Lecture de code** | Réponds à chaque sous-question dans les blocs `> Réponse :`. |

---

## Section 0 - Révision du jour 1 (3 min - 4 pts)

**Q0.1 (QCU, 1 pt) `[CP3]`**
Quel verbe HTTP **remplace une ressource en entier** ?

- a) PATCH
- b) PUT
- c) POST
- d) GET

**Q0.2 (QCU, 1 pt) `[CP3]`**
Un `DELETE /challenges/3` a réussi, il n'y a rien à renvoyer. Quel code ?

- a) 200 OK
- b) 201 Created
- c) 204 No Content
- d) 404 Not Found

**Q0.3 (QCU, 1 pt) `[CP3]`**
La route `GET /challenges` existe. Un client envoie `PUT /challenges`. Quel code HTTP est le plus juste ?

- a) 400 Bad Request
- b) 405 Method Not Allowed
- c) 500 Internal Server Error
- d) 201 Created

**Q0.4 (Ouverte, 1 pt) `[CP3]`**
`GET /challenges?category=inconnue` renvoie une liste vide. 200 ou 404 ? Pourquoi ?

> **Réponse :** _(écris ta réponse ici)_

---

## L'essentiel à retenir (5 min)

**Un middleware**, c'est une fonction qui s'exécute **avant** la route. Comme un vigile à l'entrée d'une salle.

```ts
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});
```

Il reçoit **trois** choses :

- `req` : la requête ;
- `res` : la réponse ;
- **`next`** : la fonction qui dit « c'est bon, passe à la suite ».

**Un middleware fait toujours l'une de ces deux choses :**

1. il **laisse passer** : `next()` ;
2. il **bloque** et répond lui-même : `res.status(401).json(...)`, **sans** appeler `next()`.

S'il ne fait **ni l'un ni l'autre**, la requête reste bloquée : le client attend pour toujours.

**Deux façons de le poser :**

| Écriture | Le middleware s'applique à |
| --- | --- |
| `app.use(monMiddleware)` | **toutes** les requêtes qui arrivent après cette ligne |
| `app.get("/secret", monMiddleware, (req, res) => { ... })` | **seulement** cette route |

**L'ordre compte :** Express lit le fichier de haut en bas. Un `app.use` placé après une route ne s'applique pas à cette route.

**`res.locals`** : une boîte liée à **une seule** requête. Un middleware y range une information, la route la relit.

```ts
res.locals.id = 3;      // dans le middleware
res.locals.id           // dans la route : 3
```

---

## Section 1 - Comprendre (5 min - 6 pts)

**Q1.1 (QCU, 1 pt) `[CP3]`**
Dans un middleware, à quoi sert `next()` ?

- a) à renvoyer la réponse au client
- b) à passer au middleware ou à la route suivante
- c) à relancer la même requête
- d) à arrêter le serveur

**Q1.2 (QCU, 1 pt) `[CP3]`**
Un middleware n'appelle ni `next()` ni `res.json()`. Que se passe-t-il ?

- a) Express répond 200 automatiquement
- b) Express répond 404 automatiquement
- c) la requête reste bloquée, le client attend
- d) le serveur s'arrête

**Q1.3 (QCM, 2 pts) `[CP3]`**
Quelles affirmations sur `res.locals` sont vraies ?

- a) il existe seulement pendant une requête
- b) il est partagé entre tous les utilisateurs
- c) un middleware peut y ranger une information pour la route
- d) il est enregistré dans PostgreSQL

**Q1.4 (QCU, 2 pts) `[CP3]`**
On veut qu'un middleware `requireApiKey` protège **uniquement** la route `POST /challenges`. Quelle écriture choisir ?

- a) `app.use(requireApiKey);` tout en haut du fichier
- b) `app.post("/challenges", requireApiKey, (req, res) => { ... });`
- c) `app.post("/challenges", (req, res) => { requireApiKey; ... });`
- d) `app.use("/challenges", (req, res) => { ... }, requireApiKey);`

---

## Section 2 - Lire du code (4 min - 5 pts)

**Q2.1 (Lecture de code, 5 pts) `[CP3]`**

```ts
app.get("/ping", (req, res) => {
    res.json({ message: "pong" });
});

app.use((req, res, next) => {
    console.log("requête reçue");
    next();
});

app.get("/hello", (req, res) => {
    res.json({ message: "hello" });
});

app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});
```

a) On appelle `GET /ping`. Le message « requête reçue » s'affiche-t-il dans le terminal ? Pourquoi ?
b) On appelle `GET /hello`. Le message s'affiche-t-il ? Pourquoi ?
c) On appelle `GET /bonjour`. Que reçoit le client ? Le message s'affiche-t-il ?

> **Réponse a) :** _(écris ta réponse ici)_
>
> **Réponse b) :** _(écris ta réponse ici)_
>
> **Réponse c) :** _(écris ta réponse ici)_

---

## Section 3 - Écrire des middlewares (10 min - 10 pts)

> Écris le code ici, **puis** recopie-le dans `src/app.ts` et teste avec `curl`. Rappel : tout ce que tu ajoutes va **avant** les deux blocs `app.use(...)` du 404 et des erreurs.

**Q3.1 (Code, 3 pts) `[CP3]`**
Écris un middleware posé avec `app.use`, **tout en haut** des routes, qui affiche dans le terminal la méthode et l'adresse de chaque requête, par exemple `GET /ping`.

```ts
// écris ton code ici
```

Test : appelle `curl http://localhost:3000/ping`, puis regarde le terminal de `npm run dev`.

**Q3.2 (Code, 4 pts) `[CP3]`**
Écris un middleware `requireApiKey` qui :
- répond `401` avec `{ "error": "Unauthorized" }` si l'en-tête `x-api-key` ne vaut pas `secret123` ;
- sinon laisse passer.

Puis protège une nouvelle route `GET /admin` qui répond `{ "message": "bienvenue admin" }`.

```ts
// écris ton code ici
```

Test :

```bash
curl -i http://localhost:3000/admin
curl -i -H "x-api-key: secret123" http://localhost:3000/admin
```

Attendu : `401`, puis `200`.

**Aide** : la valeur de l'en-tête se lit avec `req.headers["x-api-key"]`.

**Q3.3 (Code, 3 pts) `[CP3]`**
Écris un middleware `parseIdParam` qui :
- lit `req.params.id` et le transforme en nombre ;
- répond `400` avec `{ "error": "Invalid id" }` si ce n'est pas un entier positif ;
- sinon range le nombre dans `res.locals.id` et laisse passer.

Utilise-le sur une route `GET /items/:id` qui répond `{ "id": <le nombre> }`.

```ts
// écris ton code ici
```

Test :

```bash
curl http://localhost:3000/items/7
curl -i http://localhost:3000/items/abc
```

Attendu : `{"id":7}`, puis un `400`.

**Aide** : `Number.isInteger(id)` vaut `true` seulement pour un entier.

---

*Fin du jour 2 (25 pts). Envoie-moi tes réponses : on corrige ensemble, puis on passe au jour 3.*