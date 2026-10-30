# Jour 1 - HTTP, REST et premières routes Express (CORRIGÉ)

- **Ma note :** 11 / 25
- **Les idées à retenir :**
  1. Pour choisir un code : **bien écrite ? → existe ? → lu ou créé ?**
  2. Une **liste vide** répond **200**. Le **404**, c'est pour **un** élément précis introuvable.
  3. Les routes s'écrivent **au-dessus** du bloc du 404 dans `app.ts`.
  4. Un paramètre écrit `_req` doit être utilisé comme `_req`, ou renommé `req`.

---

## Section 1 - Les verbes et les codes (3 / 7)

**Q1.1 (QCU)** Quel verbe HTTP utilise-t-on pour **lire** une liste de défis ?

- b) GET

✅

**Q1.2 (QCU)** Quel verbe HTTP sert à **modifier une partie** d'une ressource ?

- c) PATCH

❌ J'avais gardé PUT **et** PATCH. Un QCU = une seule ligne. `PUT` remplace la ressource **en entier**, `PATCH` en modifie **une partie**.

**Q1.3 (QCU)** Une suppression a réussi et il n'y a rien à renvoyer. Quel code ?

- c) 204 No Content

❌ J'avais mis 200. Quand il n'y a **rien** à renvoyer : **204**.

**Q1.4 (QCM)** Lesquels sont des erreurs **du client** ?

- b) 400
- c) 404
- e) 409

✅ Tous les codes en 4xx. 201 est un succès, 500 une erreur du serveur.

**Q1.5 (QCU)** La route `GET /ping` existe. Un client envoie `POST /ping`. Quel code ?

- c) 405 Method Not Allowed

❌ J'avais mis 500. L'adresse existe, mais pas avec ce verbe : **405**. Le 500 veut dire « le code a planté ».

À savoir : Symfony renvoie 405 tout seul. Express, lui, répond 404 par défaut (le bloc du 404 attrape la requête). À l'examen, la bonne réponse est **405**.

---

## Section 2 - Choisir le bon code (2 / 8)

**Q2.1 (Tableau)** Le défi n°3 existe. Les ids doivent être des entiers.

| # | Requête | Code | Pourquoi ? |
| --- | --- | --- | --- |
| 1 | `GET /challenges` | 200 | lecture réussie |
| 2 | `GET /challenges/3` | 200 | le défi existe |
| 3 | `GET /challenges/999` | 404 | le défi n'existe pas |
| 4 | `GET /challenges/abc` | 400 | `abc` n'est pas un numéro : demande mal écrite |
| 5 | `POST /challenges` avec un défi valide | 201 | ressource créée |
| 6 | `POST /challenges` sans titre | 400 (ou 422) | il manque une donnée |
| 7 | `GET /challenges?category=inconnue` | 200 | la liste existe, elle est juste vide |

❌ Je l'avais laissé vide, parce que je ne comprenais pas ce qu'était `/challenges`. C'est une route **imaginaire** de l'appli Ecoda : « donne-moi les défis ». Elle n'existe pas dans le projet.

La méthode, ligne par ligne :

1. **Bien écrite ?** Non → **400**.
2. **Existe ?** Non → **404**.
3. **Tout va bien** : lu → **200**, créé → **201**.

**Q2.2 (Ouverte)** Différence entre `400` et `404` ?

> **Réponse :** 404 : la ressource n'existe pas, par exemple `GET /challenges/999`, ou une route qui n'existe pas. 400 : la demande est mal écrite, par exemple `GET /challenges/abc` alors qu'on attend un numéro.

✅

---

## Section 3 - Premières routes Express (6 / 10)

**Q3.1 (Code)** `GET /ping` qui répond `{ "message": "pong" }`.

```ts
app.get("/ping", (req, res) => {
    res.json({ message: "pong" });
});
```

✅ J'avais mis `async` : il ne sert à rien ici (rien à attendre), mais il ne gêne pas.

Avec une variable, elle ne contient que la **valeur** :

```ts
app.get("/ping", (req, res) => {
    const reponse = "pong";
    res.json({ message: reponse });
});
```

**Q3.2 (Code)** `GET /secret` qui répond toujours `401`.

```ts
app.get("/secret", (req, res) => {
    res.status(401).json({ error: "Unauthorized" });
});
```

✅

**Q3.3 (Code)** `GET /hello/:name` qui répond `{ "message": "Bonjour Lea" }`.

```ts
app.get("/hello/:name", (req, res) => {
    const reponse = `Bonjour ${req.params.name}`;
    res.json({ message: reponse });
});
```

⚠️ J'avais ajouté une ligne `var = name;` : ce n'est pas du JavaScript valide, elle aurait fait planter **tout** le fichier au démarrage.

Rappels :
- `:name` crée une case vide dans l'adresse, lue avec `req.params.name` ;
- les backticks `` ` `` et `${...}` glissent une variable dans un texte (en C# : `$"Bonjour {name}"`).

**Q3.4 (Lecture de code)**

```ts
app.get("/hello/:name", (_req, res) => {
    res.json({ message: `Bonjour ${req.params.name}` });
});
```

> **Réponse a) :** `ReferenceError: req is not defined`. Le paramètre s'appelle `_req`, mais le code utilise `req`. Pour JavaScript, ce sont deux noms différents.
>
> **Réponse b) :** renommer `_req` en `req` dans la première ligne.

❌ Je l'avais laissée vide.

---

## Les pièges rencontrés en vrai pendant la séance

- **Ma route répondait « Not found »** : elle était écrite **sous** le bloc du 404. Express lit de haut en bas et s'arrête au 404.
- **`curl` disait `Couldn't connect to server`** : l'API ne tournait pas. Il faut `npm run dev`, et attendre la ligne `listening`.
- **Mes changements n'avaient aucun effet** : mon éditeur et mon terminal n'étaient pas sur le même dossier. Le dossier en haut de l'éditeur et celui de l'invite du terminal doivent être **les mêmes**.
