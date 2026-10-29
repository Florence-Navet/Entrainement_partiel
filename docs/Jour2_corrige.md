# Jour 2 - Les middlewares Express (CORRIGÉ)

- **Ma note :** 11 / 25
- **Les trois idées à retenir :**
  1. Express lit le fichier **de haut en bas** et s'arrête à la première route qui répond.
  2. Une **liste vide** répond **200**. Le **404**, c'est pour **un** élément précis introuvable.
  3. Dans `res.json({ id: ... })`, la variable contient la **valeur**, l'étiquette n'est écrite qu'une fois.

---

## Section 0 - Révision du jour 1 (2 / 4)

**Q0.1 (QCU)** Quel verbe HTTP **remplace une ressource en entier** ?

- b) PUT

✅ `PATCH` modifie une partie, `PUT` remplace tout.

**Q0.2 (QCU)** Un `DELETE /challenges/3` a réussi, il n'y a rien à renvoyer. Quel code ?

- c) 204 No Content

✅

**Q0.3 (QCU)** La route `GET /challenges` existe. Un client envoie `PUT /challenges`. Quel code ?

- b) 405 Method Not Allowed

❌ J'avais mis 201. L'adresse existe, mais pas avec ce verbe : c'est **405**. 201 veut dire « créé avec succès ».

**Q0.4 (Ouverte)** `GET /challenges?category=inconnue` renvoie une liste vide. 200 ou 404 ?

> **Réponse :** **200**. La demande est correcte, la liste existe, elle est juste vide. Le 404 sert quand on demande **un** élément précis qui n'existe pas, comme `/challenges/999`.

❌ J'avais mis 404 (même erreur que le jour 1).

---

## Section 1 - Comprendre (5 / 6)

**Q1.1 (QCU)** À quoi sert `next()` ?

- b) à passer au middleware ou à la route suivante

✅

**Q1.2 (QCU)** Un middleware n'appelle ni `next()` ni `res.json()`.

- c) la requête reste bloquée, le client attend

✅

**Q1.3 (QCM)** Quelles affirmations sur `res.locals` sont vraies ?

- a) il existe seulement pendant une requête
- c) un middleware peut y ranger une information pour la route

⚠️ J'avais oublié **a)**. `res.locals` est vidé à chaque nouvelle requête.

**Q1.4 (QCU)** Protéger **uniquement** `POST /challenges` ?

- b) `app.post("/challenges", requireApiKey, (req, res) => { ... });`

✅ `app.use` protégerait **toutes** les routes.

---

## Section 2 - Lire du code (1 / 5)

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

> **Réponse a) :** `GET /ping` : **non**, « requête reçue » ne s'affiche pas. La route `/ping` est écrite **avant** le middleware : elle répond tout de suite, et Express ne descend jamais jusqu'au `console.log`. « pong » est la réponse envoyée au client, pas un message du terminal.
>
> **Réponse b) :** `GET /hello` : **oui**, le message s'affiche, parce que le middleware est écrit **avant** `/hello`. Express passe d'abord par lui, puis `next()` l'envoie vers `/hello`.
>
> **Réponse c) :** `GET /bonjour` : aucune route ne correspond. Express passe par le middleware (le message **s'affiche**), puis arrive au bloc du 404. Le client reçoit **404** avec `{"error":"Not found"}`.

---

## Section 3 - Écrire des middlewares (3 / 10)

**Q3.1 (Code)** Un middleware posé avec `app.use`, tout en haut des routes, qui affiche la méthode et l'adresse.

```ts
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});
```

❌ J'avais écrit une **route** (`app.get("/lol")`). Un middleware utilise `app.use`, reçoit `next`, et appelle `next()` pour laisser passer.

**Q3.2 (Code)** Le middleware `requireApiKey` et la route `/admin`.

```ts
const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
    if (req.headers["x-api-key"] !== "secret123") {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    next();
};

app.get("/admin", requireApiKey, (req, res) => {
    const response = "bienvenue admin";
    res.json({ message: response });
});
```

⚠️ J'avais seulement le squelette (qui laisse tout passer). Il manquait la vérification de la clé : le `if`, le 401 et le `return`.

**Q3.3 (Code)** Le middleware `parseIdParam` et la route `/items/:id`.

```ts
const parseIdParam = (req: Request, res: Response, next: NextFunction) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    res.locals.id = id;
    next();
};

app.get("/items/:id", parseIdParam, (req, res) => {
    res.json({ id: res.locals.id });
});
```

⚠️ Ma vérification de l'id était juste. Mais :
- j'avais posé `requireApikey` (le vigile de la **clé**) au lieu d'un vigile pour l'id : sans clé, `/items/7` répondait 401 ;
- la vérification doit être **dans** le middleware, qui range l'id dans `res.locals.id` ;
- `` `id: id` `` donnait le texte « id: id ». La réponse attendue est l'objet `{ id: 7 }`.

---

## Les tests

```bash
curl -i http://localhost:3000/admin                          # 401
curl -i -H "x-api-key: secret123" http://localhost:3000/admin # 200
curl http://localhost:3000/items/7                           # {"id":7}
curl -i http://localhost:3000/items/abc                      # 400
curl -i http://localhost:3000/items/-5                       # 400
```

Rappel : tout ce code va **au-dessus** du bloc du 404 dans `app.ts`.