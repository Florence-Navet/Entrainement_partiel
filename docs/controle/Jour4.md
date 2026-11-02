# Jour 4 - Sécuriser : bcrypt, connexion et JWT

- **Objet :** séance d'entraînement n°4 pour le partiel EC04, au format des épreuves Markdown de CODA.
- **Durée indicative :** 30 min (7 min de lecture + 23 min de questions)
- **Modalités :** lis d'abord « L'essentiel à retenir », puis réponds **sans regarder** cette partie.
- **Projet pour la partie code :** le projet ouvert dans ton éditeur **et** dans ton terminal (vérifie que c'est le même dossier), fichier `src/app.ts`. On repart de la route `POST /users` du jour 3.

---

## Comment remplir ce document

| Type de question                       | Comment répondre                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------- |
| **QCU** (une seule bonne réponse)      | Supprime les lignes des propositions incorrectes. Il ne doit rester qu'**une seule** ligne. |
| **QCM** (plusieurs réponses possibles) | Supprime les lignes des propositions incorrectes. Il reste uniquement les bonnes réponses.  |
| **Ouverte**                            | Rédige ta réponse dans le bloc `> Réponse :` sous la question.                              |
| **Code**                               | Écris ton code dans le bloc de code prévu, puis teste-le dans le projet.                    |
| **Lecture de code**                    | Réponds à chaque sous-question dans les blocs `> Réponse :`.                                |

---

## Section 0 - Révision des jours 1 à 3 (4 min - 5 pts)

> Rappel : **404 = je cherche UNE chose précise.** Une liste ou une recherche = **toujours 200**, même vide.

**Q0.1 (QCU, 1 pt) `[CP3]`**
`GET /notes` alors qu'aucune note n'a encore été créée. Quel code ?

- a) 200 OK, avec `[]`

**Q0.2 (QCU, 1 pt) `[CP3]`**
`GET /notes/42` alors que la note n°42 n'existe pas. Quel code ?

- c) 404 Not Found

**Q0.3 (QCU, 1 pt) `[CP3]`**
Dans `app.ts`, la route `GET /admin` est écrite **sous** le bloc du 404. Que reçoit le client qui appelle `GET /admin` ?

- b) 404 Not Found

**Q0.4 (Ouverte, 2 pts) `[CP3]`**
Explique avec tes mots pourquoi `GET /notes` vide répond 200, mais `GET /notes/42` répond 404.

> **Réponse :** 200 car ça existe mais il ne renvoit rien donc il dit vide poiur l'instant mais 42 n'existant pas un 404 la route n'existe pas

---

## L'essentiel à retenir (7 min)

### Trois mots à ne pas confondre

| Mot             | Ce que c'est                                  | Réversible ?         | Exemple                        |
| --------------- | --------------------------------------------- | -------------------- | ------------------------------ |
| **Hacher**      | transformer en une empreinte                  | **non**, jamais      | bcrypt, pour les mots de passe |
| **Chiffrer**    | cacher avec une clé                           | **oui**, avec la clé | HTTPS                          |
| **Jeton (JWT)** | un « bracelet » prouvant qu'on s'est connecté | sans objet           | donné après la connexion       |

### bcrypt : stocker un mot de passe

On n'enregistre **jamais** un mot de passe en clair. On enregistre son **hash** :

```ts
import bcrypt from "bcryptjs";

const hash = await bcrypt.hash("secret123", 10);
// "$2b$10$N9qo8uLOickgx2ZMRZoMye..." (60 caractères)
```

- `10` : le **coût**. Plus il est grand, plus le calcul est lent, et plus un pirate met de temps à deviner.
- Le même mot de passe donne un hash **différent** à chaque fois, grâce au **sel** (un morceau aléatoire).
- `await` : bcrypt prend un peu de temps, on attend le résultat. La route doit donc être **`async`**.

À la connexion, on ne « déchiffre » rien. On **compare** :

```ts
const ok = await bcrypt.compare("secret123", hash); // true ou false
```

### La connexion : toujours le même message d'erreur

Que l'email soit **inconnu** ou le mot de passe **faux**, on répond **exactement la même chose** :

```ts
res.status(401).json({ error: "Invalid credentials" });
```

Sinon, un pirate pourrait tester des emails un par un pour savoir qui a un compte.

### Le JWT : le bracelet après la connexion

Une fois connecté, le client reçoit un **jeton**. Il le renvoie ensuite à chaque requête, au lieu de redonner son mot de passe.

Un JWT a **trois parties** séparées par des points : `header.payload.signature`.

- **header** : comment il est signé ;
- **payload** : qui est l'utilisateur (`sub` = son id, son email). **Lisible par tout le monde** : jamais de mot de passe dedans ;
- **signature** : calculée avec un **secret** que seul le serveur connaît. Si quelqu'un modifie le payload, la signature ne correspond plus.

```ts
import jwt from "jsonwebtoken";

const JWT_SECRET = "un-secret-pour-s-entrainer";

// signer (à la connexion)
const token = jwt.sign(
  { sub: String(user.id), email: user.email },
  JWT_SECRET,
  { expiresIn: 3600 },
);

// vérifier (à chaque requête protégée) : lance une erreur si le jeton est faux ou expiré
const payload = jwt.verify(token, JWT_SECRET);
```

Le client envoie le jeton dans un **en-tête** :

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Le vigile `requireAuth`

C'est le même principe que `requireApiKey` du jour 2, mais avec un vrai jeton :

1. lire l'en-tête `Authorization` ;
2. pas de `Bearer <jeton>` → **401** ;
3. `jwt.verify` échoue → **401** ;
4. sinon, ranger l'utilisateur dans `res.locals.user`, puis `next()`.

---

## Section 1 - Comprendre (6 min - 8 pts)

**Q1.1 (QCU, 1 pt) `[CP3, CP8]`**
Pour enregistrer un mot de passe, on utilise :

- a) un JWT

**Q1.2 (QCU, 1 pt) `[CP3]`**
Pourquoi le même mot de passe donne-t-il un hash bcrypt différent à chaque fois ?

- a) parce que bcrypt ajoute un sel aléatoire

**Q1.3 (QCU, 1 pt) `[CP3]`**
De quoi se compose un JWT ?

- b) un header, un payload et une signature

**Q1.4 (QCM, 2 pts) `[CP3, CP8]`**
Que peut-on mettre dans le **payload** d'un JWT ?

- a) l'id de l'utilisateur (`sub`)
- b) son email

**Q1.5 (QCU, 1 pt) `[CP3]`**
Dans quel en-tête le client envoie-t-il son jeton ?

- c) `Authorization: Bearer <jeton>`
- **Q1.6 (Ouverte, 2 pts) `[CP8]`**
  Pourquoi la connexion répond-elle **le même** `401 Invalid credentials` pour un email inconnu et pour un mauvais mot de passe ?

> **Réponse :** car ça ne correspond a la signature du payload

---

## Section 2 - Lire du code (5 min - 6 pts)

**Q2.1 (Lecture de code, 6 pts) `[CP3, CP8]`**

```ts
app.post("/login", async (req, res) => {
  const user = users.find((u) => u.email === req.body.email);
  if (!user) {
    res.status(401).json({ error: "Email inconnu" });
    return;
  }
  if (req.body.password !== user.password) {
    res.status(401).json({ error: "Mot de passe faux" });
    return;
  }
  res.json(user);
});
```

a) Les deux messages d'erreur sont différents. Pourquoi est-ce un problème de sécurité ?
b) La comparaison `req.body.password !== user.password` montre que le mot de passe est stocké comment ? Par quoi faut-il la remplacer ?
c) `res.json(user)` : qu'est-ce qui part dans la réponse ? Qu'est-ce qu'on devrait renvoyer à la place, après une connexion réussie ?

> **Réponse a) :** parce qu'on identique clairement d'ou vient le pb le mail ou le mot passe
>
> **Réponse b) :** il est stocke en clair
>
> **Réponse c) :**on devrait renvoye que le mail et l'id eventuellement car la meme le mot de passe part.

---

## Section 3 - Écrire du code (18 min - 16 pts)

> Installation (une fois) :
>
> ```bash
> npm install bcryptjs jsonwebtoken
> npm install -D @types/jsonwebtoken
> ```
>
> En haut de `app.ts` :
>
> ```ts
> import bcrypt from "bcryptjs";
> import jwt from "jsonwebtoken";
> ```
>
> Si TypeScript souligne `bcryptjs`, installe aussi `npm install -D @types/bcryptjs`.
>
> Rappel : tout ce que tu ajoutes va **au-dessus** du bloc du 404.

**Q3.1 (Code, 4 pts) `[CP3, CP8]`**
Modifie ta route `POST /users` du jour 3 :

- la route devient **`async`** ;
- au lieu de ranger `password`, range **`passwordHash`**, calculé avec `bcrypt.hash(..., 10)` ;
- la réponse reste `{ id, email }`.

Pense à changer aussi le type : `type User = { id: number; email: string; passwordHash: string };`

```ts
app.post("/users", async (req, res) => {
  const user = {
    id: users.length + 1,
    email: req.body.email,
    passwordHash: await bcrypt.hash(req.body.password, 10),
  };

  type User = { id: number; email: string; passwordHash: string };

  users.push(user as User);

  const utilisateur = { id: user.id, email: user.email };
  res.status(201).json(utilisateur);
});
```

Test :

```bash
curl -i -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"email":"lea@ecoda.fr","password":"secret123"}'
```

Attendu : **201** avec `{"id":1,"email":"lea@ecoda.fr"}`.

**Q3.2 (Code, 4 pts) `[CP3, CP8]`**
Écris `POST /login` qui reçoit `{ "email", "password" }` :

- cherche l'utilisateur avec `users.find(...)` ;
- si l'email est inconnu **ou** si `bcrypt.compare` répond `false` → **401** `{ "error": "Invalid credentials" }` ;
- sinon → **200** `{ "message": "connected" }` (le jeton viendra à la Q3.3).

```ts
app.post("/login", async (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };
  const existingUser = users.find((u) => u.email === user.email);
  if (existingUser === undefined) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (
    user.email === undefined ||
    !(await bcrypt.compare(user.password, existingUser.passwordHash))
  ) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  res.status(200).json({ message: "connected" });
});
```

Test (refais d'abord le `POST /users`, la liste se vide à chaque redémarrage) :

```bash
curl -i -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"email":"lea@ecoda.fr","password":"secret123"}'
curl -i -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"email":"lea@ecoda.fr","password":"faux"}'
curl -i -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"email":"inconnu@ecoda.fr","password":"secret123"}'
```

Attendu : **200**, puis deux **401** avec **exactement** le même message.

**Q3.3 (Code, 4 pts) `[CP3]`**
Dans `POST /login`, remplace `{ "message": "connected" }` par un vrai jeton :

```json
{ "accessToken": "eyJ...", "tokenType": "Bearer", "expiresIn": 3600 }
```

Le payload contient `sub` (l'id, en texte) et `email`. Rien d'autre.

```ts
// écris ton code ici
```

Test : connecte-toi, puis colle le jeton sur **jwt.io** et regarde le payload.

**Q3.4 (Code, 4 pts) `[CP3, CP8]`**
Écris le vigile `requireAuth` :

- pas d'en-tête `Authorization`, ou pas de la forme `Bearer <jeton>` → **401** `{ "error": "Unauthorized" }` ;
- `jwt.verify` échoue → **401** `{ "error": "Invalid token" }` (utilise `try / catch`) ;
- sinon → range le payload dans `res.locals.user`, puis `next()`.

Puis crée `GET /me`, protégée par `requireAuth`, qui renvoie `res.locals.user`.

```ts
// écris ton code ici
```

Test (remplace `<jeton>` par celui reçu au login) :

```bash
curl -i http://localhost:3000/me
curl -i -H "Authorization: Bearer <jeton>" http://localhost:3000/me
curl -i -H "Authorization: Bearer nimportequoi" http://localhost:3000/me
```

Attendu : **401** `Unauthorized`, **200** avec tes infos, puis **401** `Invalid token`.

---

_Fin du jour 4 (35 pts). Envoie-moi tes réponses : on corrige ensemble. Au jour 5, on passe à Redis._
