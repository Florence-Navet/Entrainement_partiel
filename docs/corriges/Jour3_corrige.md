# Jour 3 - Recevoir des données : POST, validation, Zod et DTO (CORRIGÉ)

- **Ma note :** 19 / 30 (63 %, contre 44 % aux jours 1 et 2)
- **Les idées à retenir :**
  1. **404 = je cherche UNE chose précise** (`/challenges/999`). **Une liste ou une recherche = toujours 200**, même vide.
  2. Express lit `app.ts` **de haut en bas** : une route sous le bloc du 404 ne répond jamais.
  3. Un mot de passe se **hache** avec **bcrypt**. Ce n'est ni du chiffrement, ni un JWT.
  4. On **garde** l'utilisateur complet, mais on **renvoie** seulement un DTO, sans mot de passe.

---

## Section 0 - Révision des jours 1 et 2 (1 / 5)

**Q0.1 (QCU)** `GET /challenges?category=sport` ne trouve aucun défi. Quel code ?

- a) 200 OK, avec une liste vide

❌ J'avais mis 404 (troisième fois). Une recherche qui ne trouve rien n'est pas une erreur : la liste existe, elle est vide. Je l'ai vu en vrai avec `GET /notes`, qui a répondu `"notes":[]` avec un 200.

**Q0.2 (QCU)** `DELETE /challenges` alors que seule `GET /challenges` existe.

- c) 405 Method Not Allowed

✅

**Q0.3 (Lecture de code)**

```ts
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

app.get("/ping", (req, res) => {
    const reponse = "pong";
    res.json({ message: reponse });
});
```

> **Réponse a) :** le client reçoit **404** avec `{"error":"Not found"}`. Le bloc du 404 est écrit **au-dessus** de `/ping` : Express s'arrête dessus et ne descend jamais jusqu'à la route.
>
> **Réponse b) :** **déplacer** la route `/ping` **au-dessus** du bloc du 404.

❌ J'avais répondu « pong », puis changé le texte en « ping ». Le problème n'est pas le texte, c'est la **place** de la route.

---

## Section 1 - Comprendre (5 / 6)

**Q1.1 (QCU)** Où sont les données JSON envoyées en POST ?

- c) `req.body`

✅

**Q1.2 (QCU)** Sans `app.use(express.json());`, que vaut `req.body` ?

- b) `undefined`

✅

**Q1.3 (QCU)** `{ "text": "" }` alors qu'il faut au moins 1 caractère.

- c) 400 Bad Request

✅

**Q1.4 (QCM)** Quels champs renvoyer après `POST /users` ?

- a) `id`
- b) `email`
- d) `createdAt`

⚠️ J'avais oublié **d)**. La date de création n'est pas sensible : on peut la renvoyer. Seul le mot de passe ne doit jamais sortir.

**Q1.5 (Ouverte)** Qu'est-ce qu'un DTO ?

> **Réponse :** un objet dans lequel je choisis les champs que j'envoie au client, seulement ceux dont il a besoin.

✅

---

## Section 2 - Lire du code (2 / 5)

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

> **Réponse a) :** un corps sans email, avec un email mal formé, ou avec un mot de passe vide, par exemple `{}` ou `{"email":"pas-un-email","password":""}`. Il serait quand même enregistré.
>
> **Réponse b) :** le **mot de passe** part dans la réponse. Correction :
> ```ts
> res.status(201).json({ id: user.id, email: user.email });
> ```
>
> **Réponse c) :** si la liste (ou la base) fuit, tous les mots de passe sont lisibles. On **hache** le mot de passe avec **bcrypt** avant de l'enregistrer.

⚠️ a) à moitié juste. b) j'avais trouvé le mot de passe, mais pas réécrit la ligne. c) ❌ J'avais écrit « chiffrer avec JWT » :
- **bcrypt hache** : à sens unique, on ne peut jamais retrouver le mot de passe ;
- **chiffrer** est réversible avec une clé : pas pour un mot de passe ;
- **JWT** est le jeton donné après la connexion, rien à voir avec le stockage.

---

## Section 3 - Écrire du code (11 / 14)

**Q3.1 + Q3.3 (Code)** La liste, le schéma, `POST /notes` et `GET /notes`.

En haut de `app.ts` :

```ts
import { z } from "zod";
```

Juste après `const app = express();` :

```ts
app.use(express.json());
```

En dehors des routes :

```ts
type Note = { id: number; text: string };

const notes: Note[] = [];

const NoteSchema = z.object({
    text: z.string().min(1).max(140),
});
```

Les routes, **au-dessus** du bloc du 404 :

```ts
app.post("/notes", (req, res) => {
    const result = NoteSchema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ errors: result.error.issues });
        return;
    }

    const note = { id: notes.length + 1, text: result.data.text };
    notes.push(note);
    res.status(201).json(note);
});

app.get("/notes", (req, res) => {
    res.json(notes);
});
```

⚠️ Mon code marchait. Deux remarques :
- `GET /notes` : l'énoncé attendait la liste seule. Ma version avec un message et `notes: notes` marche aussi ;
- dans ma copie, il y avait un `{}` en trop après le bloc du 404 : à supprimer.

**Q3.2 (Code)** La vérification « à la main », avant Zod.

```ts
app.post("/notes", (req, res) => {
    const text = req.body.text;
    if (!text) {
        res.status(400).json({ error: "text is required" });
        return;
    }

    const note = { id: notes.length + 1, text: text };
    notes.push(note);
    res.status(201).json(note);
});
```

⚠️ J'étais directement passée à Zod. Ça marche, mais la question demandait un simple `if`. `!text` est vrai si le texte est absent **ou** vide.

**Q3.4 (Code)** `POST /users` avec un DTO.

```ts
type User = { id: number; email: string; password: string };

const users: User[] = [];

app.post("/users", (req, res) => {
    const user = {
        id: users.length + 1,
        email: req.body.email,
        password: req.body.password,
    };
    users.push(user);

    const utilisateur = { id: user.id, email: user.email };
    res.status(201).json(utilisateur);
});
```

✅ On **garde** l'utilisateur complet dans la liste, et on **renvoie** seulement le DTO.

---

## Les erreurs Zod que j'ai vues en testant

| J'envoie | Zod répond | Ça veut dire |
| --- | --- | --- |
| `{"text":""}` | `too_small` | texte trop court (`.min(1)`) |
| `{"text":28}` | `invalid_type` | pas un texte (`z.string()`) |
| `{"text":"bonjour"}` | 201 | tout est bon |

## Les pièges rencontrés pendant la séance

- **`"notes"` entre guillemets** donne le mot « notes », pas la liste. Sans guillemets, `notes` est la boîte avec son contenu.
- **La liste se vide à chaque enregistrement** du fichier, car le serveur redémarre. Il faut refaire un `POST` avant le `GET`.
- **`user {...password}`** n'existe pas en JavaScript. Pour le DTO, je fabrique un nouvel objet : `{ id: user.id, email: user.email }`.