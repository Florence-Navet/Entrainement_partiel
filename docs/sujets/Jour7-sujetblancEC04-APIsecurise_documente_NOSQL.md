# Jour 7 - Sujet blanc EC04 : API sécurisée, documentée, NoSQL (Ecoda)

- **Objet :** sujet blanc, dans les conditions du partiel. Ce n'est pas le sujet officiel.
- **Durée :** 1h30 (90 min), chronométrée.
- **Modalités :** **sans documentation, sans recherche en ligne, sans IA, sans regarder les corrigés.** Seuls ton projet et ton terminal sont autorisés pour la partie B.
  - Le raisonnement prime sur la syntaxe exacte : un pseudo-code clair est accepté partout où « code » est indiqué dans la partie A.
- **Projet pour la partie B :** `~/projets/entrainement-partiel`. Avant de lancer le chrono : `docker compose up -d db redis`, puis `npm run dev`.

- **Nom et prénom :** _(à remplir)_
- **Heure de début :** _(à remplir)_ — **Heure de fin :** _(à remplir)_

---

## Comment remplir ce document

| Type de question | Comment répondre |
| --- | --- |
| **QCU** (une seule bonne réponse) | Supprime les lignes des propositions incorrectes. Il ne doit rester qu'**une seule** ligne. |
| **QCM** (plusieurs réponses possibles) | Supprime les lignes des propositions incorrectes. Il reste uniquement les bonnes réponses. |
| **Ouverte** | Rédige ta réponse dans le bloc `> Réponse :` sous la question. |
| **Code papier** | Écris ton code dans le bloc prévu. |
| **Lecture de code** | Réponds à chaque sous-question dans les blocs `> Réponse :`. |
| **Tableau à compléter** | Remplis les cellules vides. |
| **Code dans le projet (partie B)** | Écris le code dans `src/app.ts` ou `openapi.yaml`, teste-le, puis recopie-le dans le bloc prévu. |

---

## Sommaire

| Partie | Section | Thème | Durée | Points |
| --- | --- | --- | --- | --- |
| A | 1 | HTTP & REST | 8 min | 12 |
| A | 2 | Express : routes et middlewares | 8 min | 12 |
| A | 3 | Validation & DTO | 5 min | 8 |
| A | 4 | Sécurité : bcrypt, JWT, limitation | 10 min | 16 |
| A | 5 | NoSQL avec Redis | 9 min | 14 |
| A | 6 | OpenAPI | 5 min | 8 |
| B | 7 | Mini-API Ecoda dans le projet | 45 min | 30 |
| **Total** | | | **90 min** | **100 pts** |

---

# Partie A - Sur papier (45 min - 70 pts)

## Section 1 - HTTP & REST (8 min - 12 pts)

**Q1.1 (QCU, 1 pt) `[CP3]`**
Quel verbe HTTP **modifie une partie** d'une ressource ?

- a) PUT
- b) PATCH
- c) POST
- d) GET

**Q1.2 (QCU, 1 pt) `[CP3]`**
Une suppression a réussi, rien n'est renvoyé. Quel code ?

- a) 200
- b) 201
- c) 204
- d) 404

**Q1.3 (QCU, 2 pts) `[CP3]`**
La route `GET /challenges` existe. Un client envoie `DELETE /challenges`. Quel code est le plus juste ?

- a) 400
- b) 404
- c) 405
- d) 500

**Q1.4 (QCU, 2 pts) `[CP3]`**
`GET /challenges?category=sport` ne trouve aucun défi. Quel code ?

- a) 200, avec `[]`
- b) 204
- c) 400
- d) 404

**Q1.5 (Tableau à compléter, 6 pts) `[CP3]`**
L'utilisatrice est connectée. Le défi n°3 existe. Les ids sont des entiers positifs. Donne le code et justifie en quelques mots.

| # | Requête | Code | Pourquoi ? |
| --- | --- | --- | --- |
| 1 | `GET /challenges/3` | | |
| 2 | `GET /challenges/abc` | | |
| 3 | `GET /challenges/999` | | |
| 4 | `POST /challenges/3/complete`, la première fois aujourd'hui | | |
| 5 | La même requête, une deuxième fois le même jour | | |
| 6 | `GET /me` sans en-tête `Authorization` | | |

---

## Section 2 - Express : routes et middlewares (8 min - 12 pts)

**Q2.1 (QCU, 1 pt) `[CP3]`**
Dans `app.get("/hello/:name", ...)`, comment lit-on le prénom ?

- a) `req.query.name`
- b) `req.body.name`
- c) `req.params.name`
- d) `res.locals.name`

**Q2.2 (QCU, 1 pt) `[CP3]`**
Le client envoie `-d '{"text":"bonjour"}'` en POST. Comment lit-on `bonjour` ?

- a) `req.params.text`
- b) `req.body.text`
- c) `req.query.text`
- d) `req.text`

**Q2.3 (QCM, 2 pts) `[CP3]`**
Quelles affirmations sur un middleware sont vraies ?

- a) il reçoit `req`, `res` et `next`, dans cet ordre
- b) il doit soit appeler `next()`, soit répondre lui-même
- c) `res.locals` permet de passer une information à la route suivante
- d) il s'applique toujours à toutes les routes du fichier

**Q2.4 (Lecture de code, 4 pts) `[CP3]`**

```ts
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.get("/ping", (_req, res) => {
  const reponse = "pong";
  res.json({ message: reponse });
});

app.get("/hello/:name", (_req, res) => {
  res.json({ message: `Bonjour ${req.params.name}` });
});
```

a) Que reçoit le client pour `GET /ping` ? Pourquoi ?
b) Une fois le problème a) corrigé, `GET /hello/Lea` répond 500. Quel message s'affiche dans le terminal, et quelle est la correction ?

> **Réponse a) :** _(écris ta réponse ici)_
>
> **Réponse b) :** _(écris ta réponse ici)_

**Q2.5 (Code papier, 4 pts) `[CP3]`**
Écris un middleware `parseIdParam` qui répond `400` `{ "error": "Invalid id" }` si `req.params.id` n'est pas un entier positif, et sinon range l'id (en nombre) dans `res.locals.id` puis laisse passer.

```ts
// écris ton code ici
```

---

## Section 3 - Validation & DTO (5 min - 8 pts)

**Q3.1 (QCU, 1 pt) `[CP3]`**
Sans `app.use(express.json())`, que vaut `req.body` ?

- a) `{}`
- b) `undefined`
- c) le texte brut
- d) `null`

**Q3.2 (Code papier, 4 pts) `[CP3]`**
Écris un schéma Zod `RegisterSchema` : `email` est un texte, `password` est un texte d'au moins 8 caractères. Puis les lignes qui vérifient `req.body` et répondent `400` avec la liste des erreurs si c'est invalide.

```ts
// écris ton code ici
```

**Q3.3 (Ouverte, 3 pts) `[CP3, CP8]`**
Qu'est-ce qu'un DTO ? Donne l'exemple de la réponse de `POST /users`.

> **Réponse :** _(écris ta réponse ici)_

---

## Section 4 - Sécurité : bcrypt, JWT, limitation (10 min - 16 pts)

**Q4.1 (QCU, 1 pt) `[CP8]`**
Pour enregistrer un mot de passe :

- a) un JWT
- b) un hash bcrypt
- c) un chiffrement réversible
- d) en clair

**Q4.2 (QCU, 1 pt) `[CP3]`**
`{ expiresIn: "3600" }`, avec des guillemets, donne un jeton valable :

- a) 3600 secondes
- b) 3600 minutes
- c) 3600 millisecondes
- d) pour toujours

**Q4.3 (QCM, 2 pts) `[CP8]`**
Que peut-on mettre dans le payload d'un JWT ?

- a) `sub`, l'id de l'utilisateur
- b) son email
- c) le hash de son mot de passe
- d) `exp`, la date d'expiration

**Q4.4 (Ouverte, 2 pts) `[CP8]`**
Qu'est-ce qui garantit qu'un JWT n'a pas été modifié par le client ?

> **Réponse :** _(écris ta réponse ici)_

**Q4.5 (Ouverte, 2 pts) `[CP8]`**
Pourquoi la connexion répond-elle le même `401 Invalid credentials` pour un email inconnu et un mauvais mot de passe ?

> **Réponse :** _(écris ta réponse ici)_

**Q4.6 (Lecture de code, 4 pts) `[CP8]`**

```ts
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
  }
  const token = header.split(" ")[1];
  const payload = jwt.verify(token, JWT_SECRET);
  res.locals.user = payload;
  next();
};
```

a) Il manque une ligne après le premier `res.status(401)...`. Laquelle, et que se passe-t-il sans elle ?
b) Un jeton faux fait répondre l'API **500** au lieu de 401. Pourquoi ? Comment le corriger ?

> **Réponse a) :** _(écris ta réponse ici)_
>
> **Réponse b) :** _(écris ta réponse ici)_

**Q4.7 (Ouverte, 4 pts) `[CP8]`**
Explique comment limiter `POST /login` à 5 tentatives par minute et par visiteur avec Redis : quelle clé, quelles commandes, quel code de réponse et quel en-tête.

> **Réponse :** _(écris ta réponse ici)_

---

## Section 5 - NoSQL avec Redis (9 min - 14 pts)

**Q5.1 (QCU, 1 pt) `[CP8]`**
Où Redis garde-t-il ses données ?

- a) sur le disque
- b) en mémoire (RAM)
- c) dans le `.env`
- d) dans le navigateur

**Q5.2 (QCU, 1 pt) `[CP3]`**
Quelle ligne ajoute l'en-tête `X-Cache: MISS` à la réponse ?

- a) `redis.set("X-Cache", "MISS")`
- b) `res.set("X-Cache", "MISS")`
- c) `req.set("X-Cache", "MISS")`
- d) `res.json({ "X-Cache": "MISS" })`

**Q5.3 (Tableau à compléter, 4 pts) `[CP8]`**
Complète avec la commande **ioredis**.

| Besoin | Commande |
| --- | --- |
| ranger `"ok"` sous `status` pour 60 secondes | |
| lire `status` | |
| ajouter 1 à `visits` | |
| supprimer `cache:challenges` | |

**Q5.4 (Ouverte, 2 pts) `[CP8]`**
`TTL announcement` répond `-2`. Qu'est-ce que ça veut dire ? Et `-1` ?

> **Réponse :** _(écris ta réponse ici)_

**Q5.5 (Lecture de code, 6 pts) `[CP8]`**

```ts
app.get("/challenges", async (req, res) => {
  const cached = await redis.get("cache:challenges");
  if (cached !== null) {
    res.json(cached);
    return;
  }
  await redis.set("cache:challenges", JSON.stringify(challenges));
  res.json(challenges);
});
```

a) Au 2e appel, le client reçoit un texte plein de `\"` au lieu d'une liste. Pourquoi ? Que faut-il écrire à la place de `res.json(cached)` ?
b) Il manque une durée de vie. Quel est le problème ? Corrige la ligne `redis.set`.
c) Un nouveau défi est ajouté. Que faut-il faire dans la route de création pour que le cache reste juste ?

> **Réponse a) :** _(écris ta réponse ici)_
>
> **Réponse b) :** _(écris ta réponse ici)_
>
> **Réponse c) :** _(écris ta réponse ici)_

---

## Section 6 - OpenAPI (5 min - 8 pts)

**Q6.1 (QCM, 2 pts) `[CP3]`**
Que décrit un fichier OpenAPI ?

- a) les adresses et verbes des routes
- b) les réponses possibles avec leurs codes
- c) si une route demande un jeton
- d) les mots de passe des utilisateurs

**Q6.2 (Lecture de code, 3 pts) `[CP3]`**

```yaml
paths:
  /ping:
    get:
      summary: Vérifier que l'API répond
      responses:
        "200":
          description: pong
    /users:
      post:
        summary: Créer un compte
```

Dans Swagger, la route `/users` n'apparaît pas. Pourquoi ? Comment corriger ?

> **Réponse :** _(écris ta réponse ici)_

**Q6.3 (Ouverte, 3 pts) `[CP3]`**
Dans Swagger, `GET /me` répond `401 Unauthorized`, et le bloc Curl ne contient aucune ligne `Authorization`. Que s'est-il passé, et que faut-il faire ?

> **Réponse :** _(écris ta réponse ici)_

---

# Partie B - Dans le projet (45 min - 30 pts)

> Écris le code dans `src/app.ts`, **au-dessus** du bloc du 404. Teste chaque question avec `curl` avant de passer à la suivante, puis recopie ton code dans le bloc prévu.
> Tu peux réutiliser tout ce qui existe déjà dans ton projet : `requireAuth`, `parseIdParam`, `users`, `/login`…

### Les données de départ

Ajoute cette liste **en mémoire**, en haut de `app.ts`, avec les autres déclarations :

```ts
type Challenge = { id: number; title: string; category: string; points: number };

const challenges: Challenge[] = [
  { id: 1, title: "Se déplacer à vélo", category: "carbone", points: 10 },
  { id: 2, title: "Repas 100 % végétarien", category: "alimentation", points: 10 },
  { id: 3, title: "Faire un trajet en covoiturage", category: "carbone", points: 20 },
];
```

### Annexe : une commande Redis en plus

| Commande | Ce qu'elle fait | Renvoie |
| --- | --- | --- |
| `await redis.incrby(cle, 20)` | ajoute 20 (au lieu de 1) | le nouveau total |

---

### B1 - Le catalogue de défis (6 pts) `[CP3]`

- `GET /challenges` → **200**, toute la liste ;
- `GET /challenges?category=carbone` → seulement les défis de cette catégorie ;
- `GET /challenges/:id` → **200** avec le défi, **404** `{ "error": "Challenge not found" }` s'il n'existe pas, **400** si l'id n'est pas un entier positif (utilise `parseIdParam`).

```ts
// recopie ton code ici
```

Tests :

```bash
curl http://localhost:3000/challenges
curl "http://localhost:3000/challenges?category=carbone"
curl -i http://localhost:3000/challenges/3
curl -i http://localhost:3000/challenges/999
curl -i http://localhost:3000/challenges/abc
```

### B2 - Valider un défi, une fois par jour (10 pts) `[CP3, CP8]`

`POST /challenges/:id/complete`, **protégée par `requireAuth`** :

- défi inexistant → **404** ;
- première validation du jour → **201** `{ "challengeId": 3, "points": 20, "totalPoints": 20 }` ;
- deuxième validation du même défi le même jour → **409** `{ "error": "Challenge already completed today" }`.

**Contraintes :**
- l'id de l'utilisateur est dans `res.locals.user.sub` ;
- pour savoir si le défi a déjà été validé aujourd'hui, utilise une clé Redis qui expire au bout de **24 heures** ;
- le total de points de l'utilisatrice est gardé dans Redis, sous `points:<id de l'utilisateur>`.

```ts
// recopie ton code ici
```

Tests (remplace `<jeton>` par celui reçu au login) :

```bash
curl -i -X POST http://localhost:3000/challenges/3/complete -H "Authorization: Bearer <jeton>"
curl -i -X POST http://localhost:3000/challenges/3/complete -H "Authorization: Bearer <jeton>"
curl -i -X POST http://localhost:3000/challenges/1/complete -H "Authorization: Bearer <jeton>"
curl -i -X POST http://localhost:3000/challenges/3/complete
```

Attendu : **201** (total 20), **409**, **201** (total 30), **401**.

### B3 - Mon total de points (4 pts) `[CP3, CP8]`

`GET /me/points`, **protégée par `requireAuth`** → **200** `{ "totalPoints": 30 }`. Si l'utilisatrice n'a encore rien validé : `{ "totalPoints": 0 }`.

```ts
// recopie ton code ici
```

### B4 - Le catalogue en cache (5 pts) `[CP8]`

Mets `GET /challenges` (sans filtre) en cache Redis **60 secondes**, avec les en-têtes `X-Cache: MISS` puis `X-Cache: HIT`.

```ts
// recopie ton code ici
```

### B5 - Documenter la validation (5 pts) `[CP3]`

Dans `openapi.yaml`, ajoute `POST /challenges/{id}/complete` :
- le paramètre `id` (dans le chemin, entier, obligatoire) ;
- la sécurité `bearerAuth` ;
- les réponses `"201"`, `"401"`, `"404"` et `"409"`.

**Aide pour le paramètre :**

```yaml
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
```

Vérifie dans Swagger : connecte-toi, **Authorize**, puis valide un défi.

```yaml
# recopie ton bloc ici
```

---

*Fin du sujet blanc. Note l'heure de fin, puis envoie-moi ta copie : je la corrige et la note comme un vrai partiel.*