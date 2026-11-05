# Jour 6 - Limiter les tentatives (429) et documenter l'API (OpenAPI)

- **Objet :** séance d'entraînement n°6 pour le partiel EC04, au format des épreuves Markdown de CODA.
- **Durée indicative :** 35 min (5 min de révision + 7 min de lecture + 23 min de questions)
- **Modalités :** lis d'abord « L'essentiel à retenir », puis réponds **sans regarder** cette partie.
- **Projet pour la partie code :** `~/projets/entrainement-partiel`, fichier `src/app.ts`. On repart de la route `POST /login` du jour 4.
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

## Section 0 - Révision ciblée (5 min - 8 pts)

> Ces questions reprennent **mes erreurs qui reviennent**. Relis d'abord les idées à retenir des corrigés des jours 4 et 5.

**Q0.1 (QCU, 1 pt) `[CP8]`**
Pour enregistrer un mot de passe dans la base, on utilise :


- b) un hash bcrypt



**Q0.2 (QCU, 1 pt) `[CP3]`**
À quoi sert un JWT ?


- b) à prouver qu'on s'est connecté, à chaque requête suivante


**Q0.3 (QCU, 1 pt) `[CP3]`**
`jwt.sign(..., { expiresIn: "60" })`, avec des guillemets, donne un jeton valable :

- b) 60 minutes
-

**Q0.4 (QCU, 1 pt) `[CP8]`**
Où Redis garde-t-il ses données ?

- a) sur le disque


**Q0.5 (QCU, 1 pt) `[CP3]`**
Quelle ligne ajoute l'en-tête `X-Cache: HIT` à la réponse ?

- a) `redis.set("X-Cache", "HIT")`


**Q0.6 (Ouverte, 1 pt) `[CP8]`**
On a rangé une liste dans Redis avec `JSON.stringify(notes)`. Quand on la relit avec `redis.get`, qu'obtient-on : une liste, ou un texte ? Comment la retransformer en liste ?

> **Réponse :**on obtien un texte :  on la retranstranforme en la parsant avc JSON.parse

**Q0.7 (Ouverte, 2 pts) `[CP8]`**
`TTL cache:notes` répond `-2`. Qu'est-ce que ça veut dire ? Et s'il répondait `-1` ?

> **Réponse :**c-2 c'est un hit et -1 un miss

---

## L'essentiel à retenir (7 min)

### Partie 1 : limiter les tentatives de connexion

**Le problème.** Un pirate peut essayer des milliers de mots de passe sur `POST /login`, très vite, avec un programme. C'est une **attaque par force brute**.

**La solution.** On **compte** les tentatives de chaque visiteur, pendant une minute. Au-delà de 5, on refuse avec le code **429 Too Many Requests**.

**Avec Redis**, c'est le compteur du jour 5, avec une durée de vie :

1. une clé **par visiteur** : `ratelimit:login:` suivi de son adresse IP (`req.ip`) ;
2. à chaque tentative : `redis.incr(cle)`, qui renvoie le nombre de tentatives ;
3. **à la première tentative seulement** (le compteur vaut 1), on donne à la clé une durée de vie de 60 secondes : `redis.expire(cle, 60)` ;
4. si le compteur dépasse 5 → **429**, avec l'en-tête **`Retry-After`** qui dit au client combien de secondes attendre.

Au bout de 60 secondes, la clé s'efface toute seule : le compteur repart à zéro.

| Commande | Ce qu'elle fait | Renvoie |
| --- | --- | --- |
| `await redis.incr(cle)` | ajoute 1 | le nouveau total |
| `await redis.expire(cle, 60)` | donne 60 secondes de vie à une clé **qui existe déjà** | `1` |
| `await redis.ttl(cle)` | les secondes restantes | un nombre |

On l'écrit comme un **vigile**, posé sur `POST /login`, exactement comme `requireAuth`.


```ts
const limitLogin = async (req: Request, res: Response, next: NextFunction) => {
 const key = `ratelimit:login:${req.ip}`;
 const count = await redis.incr(key);
 if (count === 1) {
   await redis.expire(key, 60);
 }
 if (count > 5) {
  const ttl = await redis.ttl(key);
   res.set("Retry-After", String(ttl));
   res.status(429).json({ error: "Too many login attempts" });
   return;
 }

 next();

};

app.post("/login", limitLogin, async (req, res) => {


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
  // res.status(200).json({ message: "connected" });
  const token = jwt.sign(
    {
      sub: String(existingUser.id), email: existingUser.email},
      JWT_SECRET,
      { expiresIn: 3600 }
    
  );
  res.status(200).json({ accesToken: token,  tokenType: "Bearer", expiresIn: 3600 });
});

```

### Partie 2 : documenter l'API avec OpenAPI

**Le problème.** Un autre développeur (ou le correcteur du partiel) veut savoir quelles routes existent, ce qu'elles attendent et ce qu'elles répondent, sans lire le code.

**OpenAPI** est un **format standard** pour décrire une API, dans un fichier `openapi.yaml`. **Swagger UI** transforme ce fichier en une **page web** où l'on peut lire la documentation et **tester** les routes.

Un fichier OpenAPI décrit, pour chaque route :
- l'**adresse** et le **verbe** ;
- les **paramètres** et le **corps** attendus ;
- **toutes** les réponses possibles, avec leur code (200, 401, 404…) ;
- si la route est **protégée** par un jeton.

```yaml
openapi: 3.0.3
info:
  title: API d'entraînement
  version: 1.0.0
paths:
  /ping:
    get:
      summary: Vérifier que l'API répond
      responses:
        "200":
          description: L'API répond pong
```

⚠️ En YAML, **les espaces au début des lignes comptent**, comme dans `docker-compose.yml`. Chaque niveau est décalé de **2 espaces**. Jamais de tabulation.

---

## Section 1 - Comprendre (5 min - 6 pts)

**Q1.1 (QCU, 1 pt) `[CP8]`**
Que veut dire le code **429** ?


- b) trop de requêtes en peu de temps


**Q1.2 (QCU, 1 pt) `[CP8]`**
Pourquoi limiter le nombre de tentatives sur `POST /login` ?


- b) pour empêcher un pirate d'essayer des milliers de mots de passe


**Q1.3 (QCU, 1 pt) `[CP8]`**
Pourquoi la clé contient-elle l'adresse IP du visiteur (`ratelimit:login:<ip>`) ?

- a) pour compter les tentatives de **chaque** visiteur séparément


**Q1.4 (QCM, 2 pts) `[CP3]`**
Que trouve-t-on dans une documentation OpenAPI ?

- a) les adresses et verbes des routes
- b) les réponses possibles avec leurs codes




**Q1.5 (QCU, 1 pt) `[CP3]`**
Qu'est-ce que Swagger UI ?


- b) une page web qui affiche la documentation OpenAPI et permet de tester les routes


---

## Section 2 - Lire du code (4 min - 5 pts)

**Q2.1 (Lecture de code, 5 pts) `[CP8]`**

```ts
const limitLogin = async (req: Request, res: Response, next: NextFunction) => {
  const key = "ratelimit:login";
  const count = await redis.incr(key);
  if (count > 5) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }
  next();
};
```

a) La clé ne contient pas l'IP du visiteur. Que se passe-t-il quand **plusieurs** personnes se connectent en même temps ?
b) Il manque `redis.expire`. Que se passe-t-il au bout de 5 tentatives, même une heure plus tard ?
c) Il manque l'en-tête `Retry-After`. À quoi sert-il ?

> **Réponse a) :** pb de connection pour les utilisateurs
>
> **Réponse b) :** la cle est toujours valable
>
> **Réponse c) :**à retenter la connection ulterieur pour un utilisateurs normal

---

## Section 3 - Code guidé (20 min - 16 pts)

> Pour chaque question, écris **toi-même** chaque étape, teste, puis passe à la suivante. Si tu bloques, envoie-moi ce que tu as écrit.
> Rappel : tout ce que tu ajoutes va **au-dessus** du bloc du 404.

### Q3.1 - Le vigile `limitLogin` (8 pts) `[CP8]`

**But :** au-delà de 5 tentatives de connexion en une minute, `POST /login` répond **429**.

**Étape 1 : la coquille.** Écris un vigile `limitLogin`, **`async`**, qui reçoit `req`, `res`, `next`, et qui pour l'instant appelle seulement `next()`. Pose-le sur ta route `POST /login`, **entre** l'adresse et la fonction de la route.

**Indice :** c'est la même forme que `requireAuth`, avec `async` en plus.

**Étape 2 : compter.** Dans le vigile, avant `next()` :
- fabrique la clé : `` const key = `ratelimit:login:${req.ip}`; `` ;
- ajoute 1 au compteur avec `redis.incr`, et range le résultat dans `count`.

Teste avec 3 connexions, puis regarde dans la console Redis : `KEYS ratelimit:*`, puis `GET` sur la clé affichée.

**Étape 3 : la durée de vie.** Si `count` vaut **1** (première tentative), donne 60 secondes de vie à la clé avec `redis.expire`.

Teste, puis `TTL` sur la clé dans la console Redis : le nombre doit descendre depuis 60.

**Étape 4 : bloquer.** Si `count` est **supérieur à 5** :
- lis les secondes restantes avec `redis.ttl(key)` ;
- ajoute l'en-tête `Retry-After` avec `res.set("Retry-After", String(...))` ;
- réponds **429** avec `{ "error": "Too many requests" }` ;
- `return`.

```ts
// écris ton code ici
```

**Test :** lance 7 connexions d'un coup.

```bash
for i in 1 2 3 4 5 6 7; do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"email":"lea@ecoda.fr","password":"faux"}'; done
```

- `-s -o /dev/null` : n'affiche pas le corps de la réponse ;
- `-w "%{http_code}\n"` : affiche seulement le **code**.

Attendu : cinq **401**, puis deux **429**. Attends une minute, relance : de nouveau des **401**.

### Q3.2 - Documenter l'API avec Swagger UI (8 pts) `[CP3]`

**Installation (une fois) :**

```bash
npm install swagger-ui-express yaml
npm install -D @types/swagger-ui-express
```

**Étape 1 : le fichier de documentation.** À la **racine** du projet (à côté de `package.json`), crée `openapi.yaml`. Recopie le modèle de l'essentiel (avec `/ping`), et vérifie les espaces.

**Étape 2 : afficher la page.** En haut de `app.ts`, ajoute :

```ts
import fs from "fs";
import YAML from "yaml";
import swaggerUi from "swagger-ui-express";
```

Puis, juste après `app.use(express.json());` :

```ts
const openapiDocument = YAML.parse(fs.readFileSync("openapi.yaml", "utf8"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
```

- `fs.readFileSync` : lit le fichier `openapi.yaml` ;
- `YAML.parse` : le transforme en objet JavaScript ;
- `app.use("/docs", ...)` : affiche la documentation à l'adresse `/docs`.

Ouvre **http://localhost:3000/docs** dans ton navigateur. Tu dois voir la route `/ping`. Clique dessus, puis **Try it out** et **Execute** : la réponse `pong` s'affiche.

**Étape 3 : documenter `POST /login`.** Dans `openapi.yaml`, sous `paths:`, ajoute la route `/login` avec :
- `post:` et un `summary` ;
- un `requestBody` qui attend `email` et `password` ;
- les réponses `"200"` (jeton renvoyé), `"401"` (identifiants invalides) et `"429"` (trop de tentatives).

**Aide pour le `requestBody` :**

```yaml
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                password:
                  type: string
```

Recharge `/docs` : la route `/login` apparaît, avec ses trois réponses.

**Étape 4 : documenter `GET /me`, protégée par un jeton.**
1. tout en bas du fichier, au même niveau que `paths:`, déclare le type de sécurité :

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
```

2. ajoute la route `/me` avec `get:`, les réponses `"200"` et `"401"`, et ces deux lignes sous `get:` :

```yaml
      security:
        - bearerAuth: []
```

Recharge `/docs` : un cadenas apparaît sur `/me`, et un bouton **Authorize** en haut de la page. Connecte-toi avec `/login` dans Swagger, copie le jeton, colle-le dans **Authorize**, puis teste `/me` : tu dois obtenir **200**.

```yaml
openapi: 3.0.3
info:
  title: API d'entraînement
  version: 1.0.0
paths:
  /ping:
    get:
      summary: Vérifier que l'API répond
      responses:
        "200":
          description: L'API répond pong
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: pong
  /login:
    post:
      summary: Se connecter à l'API
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  example: user@example.com
                password:
                  type: string
                  example: password123
      responses:
        "200":
          description: Connexion réussie
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: connected
        "401":
          description: Identifiants invalides
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Invalid credentials
        "429":
          description: Trop de tentatives de connexion
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    example: Too many login attempts
```

---

*Fin du jour 6 (35 pts). Envoie-moi tes réponses : on corrige ensemble. Ensuite, on fera un sujet blanc complet, comme le jour du partiel.*