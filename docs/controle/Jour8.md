# Jour 8 - Les bons codes, et le catalogue de défis

- **Objet :** séance d'entraînement n°8 pour le partiel EC04, au format des épreuves Markdown de CODA.
- **Durée :** 15 min (3 min de lecture + 12 min de questions).
- **Modalités :** lis d'abord « L'essentiel à retenir », puis réponds **sans regarder** cette partie. **Ne modifie jamais le code de l'énoncé** : réponds seulement dans les blocs prévus.
- **Projet pour la partie code :** `~/projets/entrainement-partiel`, fichier `src/app.ts`.

---

## Comment remplir ce document

| Type de question | Comment répondre |
| --- | --- |
| **QCU** (une seule bonne réponse) | Supprime les lignes des propositions incorrectes. Il ne doit rester qu'**une seule** ligne. |
| **Tableau à compléter** | Remplis les cellules vides. |
| **Code guidé** | Suis les étapes. Écris toi-même chaque morceau, teste, puis passe au suivant. |

---

## L'essentiel à retenir (3 min)

### La méthode des trois questions

Pour choisir un code, je pose ces questions **dans l'ordre**. Dès qu'une réponse est « non », j'ai mon code.

1. **Suis-je connectée, si la route l'exige ?** Non → **401**
2. **La demande est-elle bien écrite ?** (`abc` au lieu d'un nombre, un champ manquant) Non → **400**
3. **Ce que je cherche existe-t-il ?** Non → **404**
4. **L'action est-elle possible maintenant ?** (déjà fait aujourd'hui) Non → **409**
5. **Tout va bien :** lu → **200** ; créé → **201** ; supprimé, rien à renvoyer → **204**

### Les trois pièges

| Situation | Code | Pas… |
| --- | --- | --- |
| une **liste** ou une **recherche** vide | **200** avec `[]` | 404 |
| `abc` à la place d'un numéro | **400** | 405 |
| déjà fait aujourd'hui | **409** | 401 |

**405**, c'est seulement quand **le verbe** n'est pas accepté (`DELETE` sur une route qui n'a que `GET`).

### Lire un filtre

`GET /challenges?category=carbone` → `req.query.category` vaut `"carbone"`.

Pour garder seulement certains éléments d'une liste :

```ts
challenges.filter((c) => c.category === "carbone")
```

---

## Section 1 - Les codes (5 min - 10 pts)

**Q1.1 (Tableau à compléter, 8 pts) `[CP3]`**
Le défi n°3 existe. Les ids sont des entiers positifs. Donne le code.

| # | Requête | Code |
| --- | --- | --- |
| 1 | `GET /challenges?category=sport` (aucun défi sport) |404 |
| 2 | `GET /challenges/abc` |400 |
| 3 | `GET /challenges/999` |404 |
| 4 | `DELETE /challenges` (la route n'existe qu'en `GET`) |405 |
| 5 | `POST /challenges/3/complete` sans jeton | 201|
| 6 | `POST /challenges/3/complete` avec jeton, 2e fois aujourd'hui |200 |
| 7 | `DELETE /notes/1` réussi, rien à renvoyer | 204|
| 8 | `POST /users` réussi | 201|

**Q1.2 (QCU, 1 pt) `[CP3]`**
Quelle est la différence entre 401 et 409 ?

- a) 401 : pas connecté ; 409 : connecté, mais l'action contredit l'état actuel

**Q1.3 (QCU, 1 pt) `[CP3]`**
Une recherche ne trouve aucun résultat. Le client reçoit :

- a) 404, car il n'y a rien


---

## Section 2 - Le catalogue de défis (7 min - 10 pts)

> On reprend B1 du sujet blanc. La liste `challenges` est déjà dans ton `app.ts`.

### Q2.1 - Le filtre par catégorie (5 pts) `[CP3]`

**But :** `GET /challenges?category=carbone` renvoie seulement les défis 1 et 3.

**Étape 1.** Au début de ta route `GET /challenges`, lis le filtre dans une variable `category`.

**Étape 2.** Si `category` existe : réponds avec la liste **filtrée**, puis `return`.

**Étape 3.** Sinon, la route continue et renvoie toute la liste, comme avant.

**Indice :** c'est la même forme que tes vigiles : le cas qui s'arrête d'abord, avec `return`, puis la suite.

```ts

app.get("/challenges", (req, res) => {
  const category = req.query.category;

  if (category) {
     res.json(challenges.filter((challenge) => challenge.category === category));
     return;
  }

res.json(challenges);
```

**Test :**

```bash
curl "http://localhost:3000/challenges?category=carbone"
curl "http://localhost:3000/challenges?category=sport"
curl http://localhost:3000/challenges
```

Attendu : les défis 1 et 3 ; puis `[]` ; puis les trois défis.

### Q2.2 - Le 400 avec `parseIdParam` (5 pts) `[CP3]`

**But :** `GET /challenges/abc` répond **400**, au lieu de 404.

**Étape 1.** Pose le vigile `parseIdParam` sur ta route `GET /challenges/:id`, entre l'adresse et la fonction.

**Étape 2.** Dans la route, supprime la ligne `const id = parseInt(...)`, et cherche le défi avec **`res.locals.id`**, l'id rangé par le vigile.

```ts
app.get("/challenges/:id", parseIdParam, (req, res) => {
const response = res.locals.id;
  const challenge = challenges.find(c => c.id === response);
  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  res.json(challenge);
});

```

**Test :**

```bash
curl -i http://localhost:3000/challenges/3
curl -i http://localhost:3000/challenges/999
curl -i http://localhost:3000/challenges/abc
```

Attendu : **200**, **404**, **400**.

---

*Fin du jour 8 (20 pts). Envoie-moi tes réponses : on corrige ensemble. Au jour 9, on construit B2 (le 409 « une fois par jour ») étape par étape.*