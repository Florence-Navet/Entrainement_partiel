# Jour 12 - Deuxième sujet blanc court (CORRIGÉ)

- **Ma note :** 22 / 40 (11 / 20). Partie A : 7 / 20. Partie B : 15 / 20.
- **Progression :** premier sujet blanc 8 / 20 → deuxième 11 / 20.
- **Le constat :** mon code fait les choses justes, mais mes QCU disent le contraire. Je sais faire, il me reste à reconnaître la bonne réponse.
- **Mes moyens mnémotechniques :**
  - **204** : le **0** au milieu = **rien** à renvoyer ;
  - **V.E.R.** : **V**érifier, **É**crire, **R**épondre ;
  - **S**tringify = **S**tocker · **P**arse = **P**rendre ;
  - **Express pressé `:`** · **OpenAPI ouvert `{}`**.
- **Mes deux réflexes pour le jour J :**
  - écrire **le chiffre et son nom** ensemble (204 No Content), pour voir s'ils vont ensemble ;
  - **relire la consigne** une deuxième fois avant chaque question.

---

# Partie A - Sur papier (7 / 20)

**QA.1 (5 / 6)**

| # | Requête | Code | |
| --- | --- | --- | --- |
| 1 | `GET /challenges?category=eau` | 200, liste vide | ✅ |
| 2 | `DELETE /challenges/2` réussi | **204 No Content** | ❌ j'avais écrit « 200 no content » (inattention : No Content est le nom du 204) |
| 3 | `DELETE /challenges/abc` | 400 | ✅ |
| 4 | `DELETE /challenges/999` | 404 | ✅ |
| 5 | `DELETE /challenges/2` sans jeton | 401 | ✅ |
| 6 | `PUT /ping` | 405 | ✅ |

Une recherche vide (`GET`) répond **200** avec `[]`. Une suppression réussie (`DELETE`) répond **204**, sans rien.

**QA.2** → **c) vérifier, écrire, répondre** ❌ (j'avais mis b, 4e fois). Ma route B1 est pourtant écrite dans cet ordre.

**QA.3** → **b) `JSON.parse(cached)`** ❌ (j'avais mis `stringify`). **S**tringify = **S**tocker, **P**arse = **P**rendre.

**QA.4** → **c) 120 millisecondes** ✅

**QA.5** → **b) `/challenges/{id}`** ❌ (j'avais mis `/challenges/id`). Les accolades.

**QA.6 (1 / 4)**

```ts
app.delete("/challenges/:id", parseIdParam, async (req, res) => {
  const index = challenges.findIndex((c) => c.id === res.locals.id);
  res.status(204).send();
  if (index === -1) {
    res.status(404).json({ error: "Challenge not found" });
  }
  challenges.splice(index, 1);
});
```

> **Réponse a) :** le 204 est envoyé **avant** les vérifications. Pour un défi qui n'existe pas, la route répond 204 (« supprimé »), puis essaie de répondre 404 : Express plante (`Cannot set headers after they are sent`). Et comme il n'y a pas de `return`, `splice(-1, 1)` est exécuté : il supprime le **dernier** défi de la liste.
>
> **Réponse b) :** **`return`**, juste après le 404.
>
> **Réponse c) :** `await redis.del("cache:challenges");`, juste après le `splice`.

⚠️ J'avais vu que le 204 était au mauvais endroit, mais pas la conséquence. b) et c) n'étaient pas répondues, et j'avais écrit du code de cache au lieu de répondre.

**QA.7 (0 / 6)**

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
```

❌ J'avais écrit une route `DELETE` au lieu du vigile demandé. Pourtant, je l'avais écrit parfaitement au bloc-notes. 6 points perdus pour une consigne mal lue.

---

# Partie B - Dans le projet (15 / 20)

## B1 - Supprimer un défi (11 / 12)

```ts
app.delete("/challenges/:id", requireAuth, parseIdParam, async (req, res) => {
  const index = challenges.findIndex((c) => c.id === res.locals.id);
  if (index === -1) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  challenges.splice(index, 1);
  await redis.del("cache:challenges");

  res.status(204).send();
});
```

✅ Les deux vigiles, le 404 avec `return`, le `splice`, le `redis.del` et le 204. L'ordre **V.E.R.** est respecté.

Ce qui m'a aidée à la corriger :
- `"Not found"` (le bloc du 404 général) ≠ `"Challenge not found"` (ma route) : avec `"Not found"`, Express ne trouvait **aucune** route. Mon adresse était `/challenges/` sans `:id` ;
- la clé `cache:challenge` (sans s) ne supprimait pas le vrai cache. Pour retrouver le nom exact : `grep -n "cache:" src/app.ts`, ou `KEYS cache:*` dans la console Redis.

## B2 - Documenter la suppression (4 / 8)

```yaml
  /challenges/{id}:
    delete:
      summary: Supprimer un défi
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        "204":
          description: Défi supprimé
        "400":
          description: Id invalide
        "401":
          description: Jeton absent ou invalide
        "404":
          description: Défi introuvable
```

⚠️ Ce qui manquait :
- **`/challenge/{id}:`** → **`/challenges/{id}:`** (le **s**) ;
- **`type: integer`** décalé de 2 espaces **sous** `schema:` ;
- le **400** (`parseIdParam`) et le **401** (`requireAuth`).

Les erreurs YAML rencontrées :
- **`MULTILINE_IMPLICIT_KEY`** : il manquait les `:` à la fin du chemin ;
- **`DUPLICATE_KEY`** : `/me/points` était écrit deux fois. `grep -n "/me/points" openapi.yaml` trouve les deux exemplaires.

---

## Les pièges d'environnement

- **Changer d'ordinateur** : `git pull`, puis **`npm install`** (sinon `Cannot find module 'bcryptjs'`), puis `npm run dev`.
- **`DELETE: command not found`** : `DELETE` est un verbe HTTP, pas une commande. On écrit `curl -X DELETE ...`, sur une seule ligne.
- **`echo $TOKEN` n'affiche rien** : la variable n'existe que dans le terminal où je l'ai créée. Pour la recréer d'un coup :

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"email":"lea@ecoda.fr","password":"secret123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).accessToken')
```