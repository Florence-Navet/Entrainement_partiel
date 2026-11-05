# Jour 5 - Redis : compteur, durée de vie et cache

- **Objet :** séance d'entraînement n°5 pour le partiel EC04, au format des épreuves Markdown de CODA.
- **Durée indicative :** 30 min (7 min de lecture + 23 min de questions)
- **Modalités :** lis d'abord « L'essentiel à retenir », puis réponds **sans regarder** cette partie.
- **Projet pour la partie code :** `~/projets/entrainement-partiel`, fichier `src/app.ts`. On repart des routes `/notes` du jour 3.
- **Avant de commencer :** `docker compose up -d db redis`, puis `npm run dev`.

---

## Comment remplir ce document

| Type de question | Comment répondre |
| --- | --- |
| **QCU** (une seule bonne réponse) | Supprime les lignes des propositions incorrectes. Il ne doit rester qu'**une seule** ligne. |
| **QCM** (plusieurs réponses possibles) | Supprime les lignes des propositions incorrectes. Il reste uniquement les bonnes réponses. |
| **Ouverte** | Rédige ta réponse dans le bloc `> Réponse :` sous la question. |
| **Code guidé** | Suis les étapes. Écris toi-même chaque morceau, teste, puis passe au suivant. |
| **Lecture de code** | Réponds à chaque sous-question dans les blocs `> Réponse :`. |

---

## Section 0 - Révision du jour 4 (4 min - 5 pts)

**Q0.1 (QCU, 1 pt) `[CP8]`**
Pour enregistrer un mot de passe dans la base, on utilise :

- a) un JWT
- b) un hash bcrypt
- c) un chiffrement réversible
- d) le mot de passe tel quel

**Q0.2 (QCU, 1 pt) `[CP3]`**
Dans `jwt.sign(..., { expiresIn: "3600" })`, avec des guillemets, le jeton dure :

- a) 3600 secondes (1 heure)
- b) 3600 minutes
- c) 3600 millisecondes (3,6 secondes)
- d) pour toujours

**Q0.3 (QCU, 1 pt) `[CP3]`**
Dans un vigile, où range-t-on l'utilisateur lu dans le jeton, pour que la route puisse le lire ?

- a) `req.body.user`
- b) `res.locals.user`
- c) `req.params.user`
- d) dans une variable globale

**Q0.4 (Ouverte, 2 pts) `[CP8]`**
Pourquoi la connexion répond-elle le **même** message pour un email inconnu et pour un mauvais mot de passe ?

> **Réponse :** _(écris ta réponse ici)_

---

## L'essentiel à retenir (7 min)

### Redis, c'est quoi ?

Redis est une base de données **très rapide**, qui garde tout **en mémoire** (RAM), sous forme de **clé → valeur**. Comme un grand tableau de post-it : chaque post-it a un **nom** (la clé) et un **contenu** (la valeur).

| Clé | Valeur |
| --- | --- |
| `visits` | `42` |
| `announcement` | `Réunion à 14h` |
| `cache:notes` | `[{"id":1,"text":"bonjour"}]` |

Particularité : une clé peut avoir une **durée de vie** (TTL, *time to live*). Au bout du temps, elle **s'efface toute seule**.

### Pourquoi l'utiliser à côté de PostgreSQL ?

| | PostgreSQL | Redis |
| --- | --- | --- |
| Rôle | garder les données **pour toujours** | garder des choses **temporaires**, très vite |
| Stockage | disque | mémoire |
| Si on perd tout | grave | pas grave : on recalcule |

Usages typiques : un **compteur** (visites, tentatives de connexion), une **valeur qui expire**, un **cache** (une copie rapide d'une réponse coûteuse).

### Les commandes avec ioredis

Le projet a déjà un client Redis : `import redis from "./config/redis";` (regarde en haut de `app.ts`).

| Besoin | Commande | Renvoie |
| --- | --- | --- |
| ranger une valeur | `await redis.set("cle", "valeur")` | `"OK"` |
| ranger pour 30 secondes | `await redis.set("cle", "valeur", "EX", 30)` | `"OK"` |
| lire | `await redis.get("cle")` | la valeur, ou **`null`** si elle n'existe pas |
| ajouter 1 | `await redis.incr("cle")` | la nouvelle valeur |
| supprimer | `await redis.del("cle")` | le nombre de clés supprimées |

Toutes ces commandes prennent un peu de temps : on met **`await`** devant, et la route doit être **`async`**.

⚠️ Redis ne range que du **texte**. Pour ranger une liste ou un objet : `JSON.stringify(...)`. Pour le relire : `JSON.parse(...)`, ou le renvoyer tel quel avec `res.type("json").send(...)`.

### Le cache, avec l'image du post-it

1. Je regarde d'abord le **post-it** (Redis). S'il existe → je réponds avec lui. C'est un **HIT**.
2. Sinon, j'ouvre le **classeur** (la vraie source), je cherche, puis j'**écris un post-it** pour la prochaine fois. C'est un **MISS**.
3. Le post-it s'efface tout seul après son TTL.

On le signale avec un en-tête : `X-Cache: HIT` ou `X-Cache: MISS`.

### L'invalidation

Si les données **changent** (on ajoute une note), le post-it devient **faux**. Il faut le **supprimer** juste après la modification : `await redis.del("cache:notes")`. Au prochain appel, ce sera un MISS, avec les données à jour.

### Regarder dans Redis

```bash
docker compose exec redis redis-cli
```

Puis : `KEYS *` (toutes les clés), `GET visits`, `TTL announcement` (secondes restantes). Pour sortir : `exit`.

---

## Section 1 - Comprendre (6 min - 8 pts)

**Q1.1 (QCU, 1 pt) `[CP8]`**
Où Redis garde-t-il ses données ?

- a) sur le disque, comme PostgreSQL
- b) en mémoire (RAM)
- c) dans le navigateur du client
- d) dans le fichier `.env`

**Q1.2 (QCU, 1 pt) `[CP8]`**
`await redis.get("cle")` quand la clé n'existe pas renvoie :

- a) `""` (texte vide)
- b) `0`
- c) `null`
- d) une erreur

**Q1.3 (QCU, 1 pt) `[CP8]`**
Quelle commande range `"bonjour"` sous la clé `message` pendant **60 secondes** ?

- a) `redis.set("message", "bonjour", 60)`
- b) `redis.set("message", "bonjour", "EX", 60)`
- c) `redis.set("message", "bonjour", { EX: 60 })`
- d) `redis.expire("bonjour", 60)`

**Q1.4 (QCM, 2 pts) `[CP8]`**
Pour quoi Redis est-il bien adapté ?

- a) un compteur de visites
- b) un cache de réponses
- c) garder les comptes utilisateurs pour toujours
- d) une valeur qui doit s'effacer au bout de 5 minutes

**Q1.5 (QCU, 1 pt) `[CP8]`**
Que veut dire `X-Cache: HIT` ?

- a) la réponse vient de la base de données
- b) la réponse vient du cache Redis
- c) il y a eu une erreur
- d) le cache est vide

**Q1.6 (Ouverte, 2 pts) `[CP8]`**
On ajoute une note avec `POST /notes`. Pourquoi faut-il supprimer la clé `cache:notes` juste après ? Que verrait le client sinon ?

> **Réponse :** _(écris ta réponse ici)_

---

## Section 2 - Lire du code (5 min - 6 pts)

**Q2.1 (Lecture de code, 6 pts) `[CP8]`**

```ts
app.get("/notes", async (req, res) => {
  const cached = await redis.get("cache:notes");
  if (cached !== null) {
    res.json(cached);
    return;
  }
  await redis.set("cache:notes", JSON.stringify(notes));
  res.json(notes);
});
```

a) Au deuxième appel, le client reçoit `"[{\"id\":1,\"text\":\"bonjour\"}]"` : un texte, avec des `\"`, au lieu d'une vraie liste. Pourquoi ? Que faut-il écrire à la place de `res.json(cached)` ?
b) Le `redis.set` n'a pas de durée de vie. Quel est le problème ? Comment le corriger ?
c) Il manque les en-têtes `X-Cache`. Où ajouter `HIT`, et où ajouter `MISS` ?

> **Réponse a) :** _(écris ta réponse ici)_
>
> **Réponse b) :** _(écris ta réponse ici)_
>
> **Réponse c) :** _(écris ta réponse ici)_

---

## Section 3 - Code guidé (18 min - 16 pts)

> Pour chaque question, écris **toi-même** chaque étape, teste, puis passe à la suivante. Si tu bloques, envoie-moi ce que tu as écrit.
> Rappel : tout ce que tu ajoutes va **au-dessus** du bloc du 404, et les routes qui utilisent Redis sont **`async`**.

### Q3.1 - Un compteur de visites (4 pts) `[CP8]`

**But :** `GET /visits` répond `{ "visits": 1 }`, puis `{ "visits": 2 }`, puis 3…

**Étape 1.** Écris la route `GET /visits`, **`async`**, qui répond pour l'instant `{ "visits": 0 }`. Teste.

**Étape 2.** Avant de répondre, ajoute 1 à la clé `visits` avec `redis.incr`, et range le résultat dans une variable `visits`. Renvoie-la à la place de 0.

**Indice :** regarde la route `/hello` du projet, elle fait exactement la même chose avec `hello:visits`.

```ts
// écris ton code ici
```

**Test :**

```bash
curl http://localhost:3000/visits
curl http://localhost:3000/visits
```

Attendu : `{"visits":1}`, puis `{"visits":2}`. Redémarre le serveur et rappelle `/visits` : le compteur **continue**. Pourquoi, alors que la liste `notes` se vide ?

> **Réponse :** _(écris ta réponse ici)_

### Q3.2 - Une annonce qui s'efface toute seule (4 pts) `[CP8]`

**But :** `POST /announcement` range un texte pour **30 secondes**. `GET /announcement` le renvoie, ou répond 404 quand il a expiré.

**Étape 1.** Écris `POST /announcement` : lis `req.body.text`, range-le dans Redis sous la clé `announcement`, avec `"EX", 30`. Réponds **201** avec `{ "text": ... }`.

**Étape 2.** Écris `GET /announcement` : lis la clé avec `redis.get`.
- si c'est `null` → **404** avec `{ "error": "No announcement" }` (pense au `return`) ;
- sinon → **200** avec `{ "text": ... }`.

```ts
// écris ton code ici
```

**Test :**

```bash
curl -i -X POST http://localhost:3000/announcement -H "Content-Type: application/json" -d '{"text":"Réunion à 14h"}'
curl http://localhost:3000/announcement
```

Attends 30 secondes, puis relance le `GET` : tu dois avoir un **404**.

Bonus : dans `redis-cli`, tape `TTL announcement` juste après le `POST`, plusieurs fois : le nombre descend.

### Q3.3 - Un cache sur `GET /notes` (5 pts) `[CP8]`

**But :** le premier `GET /notes` répond avec `X-Cache: MISS`, le suivant avec `X-Cache: HIT`.

**Étape 1.** Rends ta route `GET /notes` **`async`**. Au début, lis la clé `cache:notes` dans une variable `cached`.

**Étape 2.** Si `cached` n'est **pas** `null` (le HIT) :
- ajoute l'en-tête `X-Cache: HIT` avec `res.set("X-Cache", "HIT")` ;
- renvoie `cached` **tel quel** avec `res.type("json").send(cached)` ;
- `return`.

**Étape 3.** Sinon (le MISS) :
- range `JSON.stringify(notes)` sous `cache:notes`, avec `"EX", 60` ;
- ajoute l'en-tête `X-Cache: MISS` ;
- renvoie la liste avec `res.json(notes)`.

```ts
// écris ton code ici
```

**Test :**

```bash
curl -i http://localhost:3000/notes
curl -i http://localhost:3000/notes
```

Attendu : `X-Cache: MISS`, puis `X-Cache: HIT`.

### Q3.4 - Garder le cache juste (3 pts) `[CP8]`

**Le problème :** fais un `GET /notes` (MISS, puis HIT), puis un `POST /notes` avec une nouvelle note, puis un `GET /notes`. La nouvelle note **n'apparaît pas** : le post-it est périmé.

**Étape 1.** Dans `POST /notes`, juste après `notes.push(...)`, supprime la clé `cache:notes` avec `redis.del`. La route doit devenir **`async`**.

```ts
// écris ton code ici
```

**Test :**

```bash
curl -i http://localhost:3000/notes
curl -i -X POST http://localhost:3000/notes -H "Content-Type: application/json" -d '{"text":"nouvelle note"}'
curl -i http://localhost:3000/notes
```

Attendu : le dernier `GET` est un **MISS**, et contient la nouvelle note.

---

*Fin du jour 5 (35 pts). Envoie-moi tes réponses : on corrige ensemble. Au jour 6 : limiter les tentatives de connexion avec Redis (le 429), puis documenter l'API avec OpenAPI.*