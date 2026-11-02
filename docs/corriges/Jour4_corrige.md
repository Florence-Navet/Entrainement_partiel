# Jour 4 - Sécuriser : bcrypt, connexion et JWT (CORRIGÉ)

- **Ma note :** 20 / 35 (11,4 / 20). Sur les questions faites seule : 20 / 27.
- **Les Q3.3 et Q3.4** ont été faites ensuite, étape par étape, et elles fonctionnent.
- **Les idées à retenir :**
  1. **bcrypt hache** le mot de passe. Le **JWT** est le jeton donné **après** la connexion. Ce n'est pas la même chose.
  2. Même message `401 Invalid credentials` pour un email inconnu et un mauvais mot de passe : pour qu'un pirate ne sache pas **quels emails ont un compte**.
  3. Le payload d'un JWT est **lisible par tout le monde** : jamais de mot de passe dedans.
  4. `expiresIn: 3600` en **nombre** = 3600 secondes. Entre guillemets, `"3600"` = 3600 **millisecondes**.

---

## Section 0 - Révision des jours 1 à 3 (5 / 5)

**Q0.1** `GET /notes` sans aucune note → **a) 200 OK, avec `[]`** ✅

**Q0.2** `GET /notes/42` qui n'existe pas → **c) 404 Not Found** ✅

**Q0.3** Route `/admin` écrite sous le bloc du 404 → **b) 404 Not Found** ✅

**Q0.4** Pourquoi `GET /notes` vide répond 200, mais `GET /notes/42` 404 ?

> **Réponse :** `GET /notes` demande une **liste**. La liste existe, elle est juste vide : la demande a réussi, donc 200. `GET /notes/42` demande **une note précise**, la n°42. Elle n'existe pas : 404.

✅ Nuance : pour `/notes/42`, ce n'est pas **la route** qui n'existe pas (elle existe), c'est **la note n°42**.

🎉 Première fois que la liste vide est juste.

---

## Section 1 - Comprendre (4 / 8)

**Q1.1** Pour enregistrer un mot de passe, on utilise :

- b) un hash bcrypt

❌ J'avais mis JWT. Le JWT n'enregistre rien : c'est le jeton donné après la connexion.

**Q1.2** Hash différent à chaque fois → **a) parce que bcrypt ajoute un sel aléatoire** ✅

**Q1.3** Un JWT → **b) un header, un payload et une signature** ✅

**Q1.4** Dans le payload, on peut mettre :

- a) l'id de l'utilisateur (`sub`)
- b) son email
- d) la date d'expiration (`exp`)

⚠️ J'avais oublié **d)**. `exp` est ajouté tout seul par `jwt.sign`, à partir de `expiresIn`.

**Q1.5** L'en-tête du jeton → **c) `Authorization: Bearer <jeton>`** ✅

**Q1.6** Pourquoi le même `401 Invalid credentials` pour un email inconnu et un mauvais mot de passe ?

> **Réponse :** pour qu'un pirate ne puisse pas savoir quels emails ont un compte. Avec deux messages différents, il testerait une liste d'emails : « email inconnu » ou « mot de passe faux » lui dirait lesquels existent.

❌ J'avais parlé de la signature du payload, qui n'a pas de lien avec cette question.

---

## Section 2 - Lire du code (4 / 6)

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

> **Réponse a) :** les messages disent si c'est l'email ou le mot de passe qui est faux. Un pirate peut donc savoir quels emails ont un compte.
>
> **Réponse b) :** le mot de passe est stocké **en clair**. Il faut stocker un hash bcrypt, et remplacer la comparaison par `await bcrypt.compare(req.body.password, user.passwordHash)`.
>
> **Réponse c) :** l'utilisateur entier part, mot de passe compris. Après une connexion réussie, on renvoie un **jeton** : `{ accessToken, tokenType: "Bearer", expiresIn: 3600 }`.

⚠️ a) ✅. b) il manquait la correction avec `bcrypt.compare`. c) j'avais vu le mot de passe qui part, mais pas le jeton à renvoyer.

---

## Section 3 - Écrire du code

### En haut de `app.ts`

```ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
```

### En dehors des routes

```ts
const JWT_SECRET = "un-secret-pour-s-entrainer";

type User = { id: number; email: string; passwordHash: string };

const users: User[] = [];
```

### Q3.1 - `POST /users` avec bcrypt (3 / 4)

```ts
app.post("/users", async (req, res) => {
  const user = {
    id: users.length + 1,
    email: req.body.email,
    passwordHash: await bcrypt.hash(req.body.password, 10),
  };
  users.push(user);

  const utilisateur = { id: user.id, email: user.email };
  res.status(201).json(utilisateur);
});
```

⚠️ Mon code marchait, mais j'avais écrit le `type User` **dans** la route, ce qui obligeait à forcer avec `as User`. Le type s'écrit **une fois**, en dehors, à côté de la liste `users`.

### Q3.2 - `POST /login` (4 / 4)

```ts
app.post("/login", async (req, res) => {
  const existingUser = users.find((u) => u.email === req.body.email);
  if (!existingUser || !(await bcrypt.compare(req.body.password, existingUser.passwordHash))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  res.status(200).json({ message: "connected" });
});
```

✅ Ma version faisait deux `if` avec le même message : ça marche aussi. Une seule condition avec `||` garantit qu'il ne peut y avoir qu'**un seul** message d'erreur.

Preuve que les deux 401 sont identiques : leur en-tête `ETag` (l'empreinte de la réponse) était le même.

### Q3.3 - Renvoyer un jeton (fait ensemble)

On remplace la dernière ligne de `/login` :

```ts
  const token = jwt.sign(
    { sub: String(existingUser.id), email: existingUser.email },
    JWT_SECRET,
    { expiresIn: 3600 },
  );
  res.status(200).json({ accessToken: token, tokenType: "Bearer", expiresIn: 3600 });
```

Les pièges rencontrés :
- **le bloc `jwt.sign` écrit en haut du fichier**, hors de toute route : il faut le fabriquer **dans `/login`**, quand la connexion a réussi ;
- **`String:(`** au lieu de `String(` : une seule faute de frappe empêche **tout le fichier** de démarrer (`TransformError`) ;
- **`existingUser`**, pas `user` : c'est l'utilisateur trouvé dans la liste qui a le vrai `id` ;
- **`expiresIn: "3600"`** entre guillemets donnait un jeton valable **3 secondes** (`exp - iat = 3`) ;
- **`accesToken`** avec un seul `s` : le nom attendu est `accessToken`.

Pour lire le jeton : la partie **du milieu** (entre les deux points) est le payload. On la décode sur **jwt.io**. `iat` et `exp` y sont ajoutés tout seuls par `jwt.sign`.

### Q3.4 - Le vigile `requireAuth` et `GET /me` (fait ensemble)

```ts
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token!, JWT_SECRET);
    res.locals.user = payload;
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  next();
};

app.get("/me", requireAuth, (req, res) => {
  const response = "hello me";
  res.json({ message: response, user: res.locals.user });
});
```

Ce que j'ai appris en l'écrivant :
- un vigile reçoit **toujours trois** paramètres, dans cet ordre : `req`, `res`, `next`. Avec un seul, Express y met la requête, pas `next` ;
- `app.get` reçoit l'adresse, le vigile, puis la route, **séparés par des virgules** ;
- la route s'écrit **en dehors** du vigile, après son `};` ;
- `next()` se place **après** le `if`, pas dedans, et le `if` se termine par `return` ;
- `jwt.verify` **lance une erreur** si le jeton est faux : on l'attrape avec `try / catch`, comme en C# ;
- le payload se range dans **`res.locals.user`**, la boîte faite pour passer une information du vigile à la route.

### Les tests

```bash
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"email":"lea@ecoda.fr","password":"secret123"}'
curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"email":"lea@ecoda.fr","password":"secret123"}'
curl -i -H "Authorization: Bearer <jeton>" http://localhost:3000/me     # 200 avec l'utilisateur
curl -i http://localhost:3000/me                                        # 401 Unauthorized
curl -i -H "Authorization: Bearer nimportequoi" http://localhost:3000/me # 401 Invalid token
```

Résultat obtenu :

```json
{"message":"hello me","user":{"sub":"1","email":"lea@ecoda.fr","iat":1793614484,"exp":1793618084}}
```

---

## Les problèmes d'environnement rencontrés (nouveau PC)

- **`npm` de Windows utilisé à la place de celui d'Ubuntu** : le message d'erreur contenait un chemin `C:\...`. `which node` et `which npm` doivent afficher `/home/quentin/.nvm/...`. Sinon, installer Node dans Ubuntu avec nvm.
- **VS Code ouvert côté Windows** : le terminal affichait `MINGW64` et l'éditeur `Cannot find module`. Il faut ouvrir le projet avec `code .` depuis Ubuntu, et voir **`WSL: Ubuntu`** en bas à gauche.
- **Error Lens** affiche les erreurs en rouge au bout des lignes : elle ne crée pas les erreurs, elle les rend visibles.
- **Un morceau de code pas fini** bloque tout le fichier : le mettre en commentaire avec **Ctrl + /** le temps de le terminer.