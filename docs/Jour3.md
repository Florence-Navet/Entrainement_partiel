# Jour 3 - Recevoir des données : POST, validation, Zod et DTO

- **Objet :** séance d'entraînement n°3 pour le partiel EC04, au format des épreuves Markdown de CODA.
- **Durée indicative :** 25 min (5 min de lecture + 20 min de questions)
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

## Section 0 - Révision des jours 1 et 2 (4 min - 5 pts)

**Q0.1 (QCU, 1 pt) `[CP3]`**
`GET /challenges?category=sport` ne trouve aucun défi. Quel code ?

- a) 200 OK, avec une liste vide
- b) 204 No Content
- c) 404 Not Found
- d) 400 Bad Request

**Q0.2 (QCU, 1 pt) `[CP3]`**
La route `GET /challenges` existe. Un client envoie `DELETE /challenges`. Quel code ?

- a) 204 No Content
- b) 404 Not Found
- c) 405 Method Not Allowed
- d) 500 Internal Server Error

**Q0.3 (Lecture de code, 3 pts) `[CP3]`**

```ts
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

app.get("/ping", (req, res) => {
    const reponse = "pong";
    res.json({ message: reponse });
});
```

a) Que reçoit le client pour `GET /ping` ? Pourquoi ?
b) Comment corriger ?

> **Réponse a) :** _(écris ta réponse ici)_
>
> **Réponse b) :** _(écris ta réponse ici)_

---

## L'essentiel à retenir (5 min)

### Recevoir des données avec POST

Avec `GET`, les informations sont dans l'**adresse** (`/items/7`, `?category=carbone`).
Avec `POST`, le client envoie un **corps** (*body*) en JSON. On le lit avec **`req.body`**.

Express ne lit **pas** le JSON tout seul. Il faut l'activer **une fois**, juste après `const app = express();` :

```ts
app.use(express.json());
```

Sans cette ligne, `req.body` vaut `undefined`.

```ts
app.post("/notes", (req, res) => {
    const text = req.body.text;
    res.status(201).json({ text: text });
});
```

Tester un POST avec `curl` :

```bash
curl -i -X POST http://localhost:3000/notes -H "Content-Type: application/json" -d '{"text":"bonjour"}'
```

- `-X POST` : le verbe ;
- `-H "Content-Type: application/json"` : « je t'envoie du JSON » ;
- `-d '...'` : le corps envoyé.

### Ne jamais faire confiance au client

Le client peut envoyer **n'importe quoi** : un champ vide, un nombre à la place d'un texte, rien du tout. Il faut **vérifier** avant d'enregistrer. Si c'est invalide : **400**.

### Zod : vérifier sans écrire des dizaines de `if`

On décrit **une fois** la forme attendue, dans un **schéma** :

```ts
import { z } from "zod";

const NoteSchema = z.object({
    text: z.string().min(1).max(140),
});

const result = NoteSchema.safeParse(req.body);
if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
}
// ici, result.data contient les données vérifiées
```

- `z.object({...})` : j'attends un objet avec ces champs ;
- `z.string().min(1).max(140)` : un texte de 1 à 140 caractères ;
- `safeParse` : vérifie, sans faire planter le programme ;
- `result.success` : `true` si c'est bon, `false` sinon ;
- `result.error.issues` : la liste des erreurs, champ par champ.

Installation (une fois) : `npm install zod`.

### Le DTO : choisir ce qui sort

Un utilisateur enregistré contient un **mot de passe**. On ne doit **jamais** le renvoyer au client.

Un **DTO** (*Data Transfer Object*), c'est l'objet qu'on **choisit** de renvoyer : seulement les champs utiles.

```ts
// ❌ renvoie tout, mot de passe compris
res.status(201).json(user);

// ✅ renvoie seulement ce qui est utile
res.status(201).json({ id: user.id, email: user.email });
```

---

## Section 1 - Comprendre (5 min - 6 pts)

**Q1.1 (QCU, 1 pt) `[CP3]`**
Dans une route `POST`, où se trouvent les données envoyées en JSON par le client ?

- a) `req.params`
- b) `req.query`
- c) `req.body`
- d) `res.locals`

**Q1.2 (QCU, 1 pt) `[CP3]`**
On a oublié `app.use(express.json());`. Que vaut `req.body` ?

- a) un objet vide `{}`
- b) `undefined`
- c) le texte brut du JSON
- d) `null`

**Q1.3 (QCU, 1 pt) `[CP3]`**
Le client envoie `{ "text": "" }` alors que le texte doit faire au moins 1 caractère. Quel code ?

- a) 200 OK
- b) 201 Created
- c) 400 Bad Request
- d) 404 Not Found

**Q1.4 (QCM, 2 pts) `[CP3, CP8]`**
Pour la réponse de `POST /users`, quels champs peut-on renvoyer au client ?

- a) `id`
- b) `email`
- c) `password`
- d) `createdAt`

**Q1.5 (Ouverte, 1 pt) `[CP3]`**
Qu'est-ce qu'un DTO, en une phrase ?

> **Réponse :** _(écris ta réponse ici)_

---

## Section 2 - Lire du code (4 min - 5 pts)

**Q2.1 (Lecture de code, 5 pts) `[CP3, CP8]`**

```ts
const users = [];

app.post("/users", (req, res) => {
    const user = {
        id: users.length + 1,
        email: req.body.email,
        password: req.body.password,
    };
    users.push(user);
    res.status(201).json(user);
});
```

a) Ce code oublie de vérifier les données. Donne un exemple de corps invalide qui serait quand même accepté.
b) Quelle donnée sensible part dans la réponse ? Réécris la dernière ligne pour l'éviter.
c) Le mot de passe est enregistré tel quel dans `users`. Quel est le problème, et quel outil utilise-t-on normalement ?

> **Réponse a) :** _(écris ta réponse ici)_
>
> **Réponse b) :** _(écris ta réponse ici)_
>
> **Réponse c) :** _(écris ta réponse ici)_

---

## Section 3 - Écrire du code (12 min - 14 pts)

> Écris le code ici, **puis** recopie-le dans `src/app.ts` et teste avec `curl`. Rappel : tout ce que tu ajoutes va **au-dessus** du bloc du 404.

**Q3.1 (Code, 3 pts) `[CP3]`**
1. Active la lecture du JSON (`express.json()`), juste après `const app = express();`.
2. Crée une liste vide `notes`, et une route `POST /notes` qui :
   - ajoute `{ id, text }` dans la liste (l'id = taille de la liste + 1) ;
   - répond **201** avec la note créée.
3. Crée `GET /notes` qui renvoie toute la liste.

```ts
// écris ton code ici
```

Test :

```bash
curl -i -X POST http://localhost:3000/notes -H "Content-Type: application/json" -d '{"text":"bonjour"}'
curl http://localhost:3000/notes
```

Attendu : **201** avec `{"id":1,"text":"bonjour"}`, puis `[{"id":1,"text":"bonjour"}]`.

**Q3.2 (Code, 3 pts) `[CP3]`**
Dans `POST /notes`, avant d'ajouter la note, réponds **400** avec `{ "error": "text is required" }` si `text` est absent ou vide. Pense au `return`.

```ts
// écris ton code ici
```

Test :

```bash
curl -i -X POST http://localhost:3000/notes -H "Content-Type: application/json" -d '{}'
```

Attendu : **400**.

**Q3.3 (Code, 4 pts) `[CP3]`**
Remplace la vérification de la Q3.2 par un schéma Zod `NoteSchema` : `text` doit être un texte de **1 à 140** caractères. Si c'est invalide : **400** avec `result.error.issues`.

Installation : `npm install zod`, puis en haut de `app.ts` : `import { z } from "zod";`

```ts
// écris ton code ici
```

Test :

```bash
curl -i -X POST http://localhost:3000/notes -H "Content-Type: application/json" -d '{"text":""}'
curl -i -X POST http://localhost:3000/notes -H "Content-Type: application/json" -d '{"text":42}'
```

Attendu : deux **400**, avec la liste des erreurs.

**Q3.4 (Code, 4 pts) `[CP3, CP8]`**
Crée une liste `users` et une route `POST /users` qui reçoit `{ "email", "password" }`, ajoute l'utilisateur dans la liste (avec un `id`), et répond **201** avec **seulement** `{ id, email }`. Le mot de passe ne doit **jamais** apparaître dans la réponse.

```ts
// écris ton code ici
```

Test :

```bash
curl -i -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"email":"lea@ecoda.fr","password":"secret123"}'
```

Attendu : **201** avec `{"id":1,"email":"lea@ecoda.fr"}`, sans `password`.

---

*Fin du jour 3 (30 pts). Envoie-moi tes réponses : on corrige ensemble. Au jour 4, on hachera le mot de passe avec bcrypt et on se connectera avec un JWT.*