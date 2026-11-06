# Jour 8 - Les bons codes, et le catalogue de défis (CORRIGÉ)

- **Ma note :** 12 / 20
- **Ce que je retiens :**
  1. **404 = je cherche UN élément par son numéro.** Une recherche (`?category=`) ou une liste vide = **200** avec `[]`.
  2. Pour choisir un code, je déroule la méthode **dans l'ordre** : connectée ? → bien écrite ? → existe ? → possible maintenant ? Je m'arrête au premier « non ».
  3. Une route doit **toujours répondre**. Sinon, le client attend pour toujours.
  4. `.filter` fabrique la liste filtrée tout seul. Je n'écris pas de liste à la main.

---

## Section 1 - Les codes (6 / 10)

**Q1.1 (5 / 8)**

| # | Requête | Code | Pourquoi |
| --- | --- | --- | --- |
| 1 | `GET /challenges?category=sport` | **200** | une recherche vide n'est pas une erreur ❌ (j'avais mis 404) |
| 2 | `GET /challenges/abc` | 400 | `abc` n'est pas un nombre ✅ |
| 3 | `GET /challenges/999` | 404 | le défi n°999 n'existe pas ✅ |
| 4 | `DELETE /challenges` | 405 | la route n'accepte pas ce verbe ✅ |
| 5 | `POST /challenges/3/complete` sans jeton | **401** | pas connectée : on s'arrête à la 1re question ❌ (j'avais mis 201) |
| 6 | La même, avec jeton, 2e fois aujourd'hui | **409** | déjà fait aujourd'hui ❌ (j'avais mis 200) |
| 7 | `DELETE /notes/1` réussi | 204 | supprimé, rien à renvoyer ✅ |
| 8 | `POST /users` réussi | 201 | créé ✅ |

Pour les lignes 5 et 6, j'ai répondu « ce qui se passe quand tout va bien ». Il faut dérouler la méthode **dans l'ordre**, et s'arrêter au premier problème.

**Q1.2** → **a) 401 : pas connecté ; 409 : connecté, mais l'action contredit l'état actuel** ✅

Ma définition était juste. Il me reste à l'**appliquer** dans le tableau.

**Q1.3** → **b) 200, avec une liste vide `[]`**

❌ J'avais mis 404.

---

## Section 2 - Le catalogue de défis (6 / 10)

### Q2.1 - Le filtre par catégorie (1 / 5)

```ts
app.get("/challenges", (req, res) => {
  const category = req.query.category;
  if (category) {
    res.json(challenges.filter((challenge) => challenge.category === category));
    return;
  }
  res.json(challenges);
});
```

Ce qui était juste : la lecture du filtre avec `req.query.category`, et la forme du `.filter(...)`.

Ce qui n'allait pas :
- **j'avais créé une liste `carbone` à la main**, avec une `interface Carbone`. Ce n'est pas utile : `.filter` fabrique la liste filtrée à partir de `challenges`, pour n'importe quelle catégorie ;
- **sans filtre**, ma route renvoyait la liste `carbone` au lieu de **tous** les défis ;
- **avec un filtre**, ma route **ne répondait jamais** : je calculais `carboneFiltre`, mais sans `res.json(...)` après. Le client restait bloqué.

Le `challenge` entre parenthèses dans `.filter((challenge) => ...)` est un **nom que je choisis** : à chaque tour, il contient un défi de la liste. On voit souvent une seule lettre (`c`), mais le nom complet est plus lisible.

### Q2.2 - Le 400 avec `parseIdParam` (5 / 5)

```ts
app.get("/challenges/:id", parseIdParam, (req, res) => {
  const challenge = challenges.find((challenge) => challenge.id === res.locals.id);
  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }
  res.json(challenge);
});
```

✅ Le vigile est bien posé, et l'id vient de `res.locals.id`. Seul détail : j'avais appelé la variable `response`, alors qu'elle contient un **id**. Un nom qui dit ce qu'elle contient (`id`) est plus lisible.

### Les tests

```bash
curl "http://localhost:3000/challenges?category=carbone"   # défis 1 et 3
curl "http://localhost:3000/challenges?category=sport"     # []
curl http://localhost:3000/challenges                      # les trois défis
curl -i http://localhost:3000/challenges/3                 # 200
curl -i http://localhost:3000/challenges/999               # 404
curl -i http://localhost:3000/challenges/abc               # 400
```