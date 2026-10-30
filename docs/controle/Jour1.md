# Jour 1 - HTTP, REST et premières routes Express

- **Objet :** séance d'entraînement n°1 pour le partiel EC04, au format des épreuves Markdown de CODA.
- **Durée indicative :** 20 min (5 min de lecture + 15 min de questions)
- **Modalités :** lis d'abord « L'essentiel à retenir », puis réponds **sans regarder** cette partie.
- **Projet pour la partie code :** `~/projets/entrainement-partiel`, fichier `src/app.ts`

---

## Comment remplir ce document

| Type de question | Comment répondre |
| --- | --- |
| **QCU** (une seule bonne réponse) | Supprime les lignes des propositions incorrectes. Il ne doit rester qu'**une seule** ligne. |
| **QCM** (plusieurs réponses possibles) | Supprime les lignes des propositions incorrectes. Il reste uniquement les bonnes réponses. |
| **Ouverte** | Rédige ta réponse dans le bloc `> Réponse :` sous la question. |
| **Code** | Écris ton code dans le bloc de code prévu, puis teste-le dans le projet. |
| **Tableau à compléter** | Remplis les cellules vides. |

---

## L'essentiel à retenir (5 min)

**Une requête HTTP**, c'est un **verbe** + une **adresse** : `GET /challenges`.

| Verbe | Sert à | Code de succès habituel |
| --- | --- | --- |
| `GET` | lire | `200 OK` |
| `POST` | créer | `201 Created` |
| `PATCH` | modifier une partie | `200 OK` |
| `PUT` | remplacer en entier | `200 OK` |
| `DELETE` | supprimer | `204 No Content` |

**Le premier chiffre du code dit à qui revient la réponse :**

- **2xx** : c'est bon ;
- **4xx** : c'est **la faute du client** ;
- **5xx** : c'est **la faute du serveur** (le code a planté).

**Les erreurs 4xx à connaître :**

| Code | Quand |
| --- | --- |
| `400 Bad Request` | la demande est mal formée (`/challenges/abc` alors qu'il faut un nombre) |
| `401 Unauthorized` | pas connecté, ou jeton absent / faux |
| `403 Forbidden` | connecté, mais pas le droit |
| `404 Not Found` | la ressource n'existe pas (`/challenges/999`) |
| `405 Method Not Allowed` | l'adresse existe, mais pas avec ce verbe |
| `409 Conflict` | la demande est valide mais contredit l'état actuel (déjà fait aujourd'hui) |
| `422 Unprocessable Entity` | données lisibles mais invalides |
| `429 Too Many Requests` | trop de requêtes en peu de temps |

**Une route Express :**

```ts
app.get("/challenges/:id", (req, res) => {
    res.status(404).json({ error: "Challenge not found" });
});
```

- `app.get` : le verbe ;
- `"/challenges/:id"` : l'adresse, avec une case `:id` qu'on lit avec `req.params.id` ;
- `res.status(404)` : le code (200 si on ne met rien) ;
- `res.json(...)` : le corps de la réponse.

---

## Section 1 - Les verbes et les codes (5 min - 7 pts)

**Q1.1 (QCU, 1 pt) `[CP3]`**
Quel verbe HTTP utilise-t-on pour **lire** une liste de défis ?


 b) GET


**Q1.2 (QCU, 1 pt) `[CP3]`**
Quel verbe HTTP sert à **modifier une partie** d'une ressource ?

- a) PUT
- c) PATCH


**Q1.3 (QCU, 1 pt) `[CP3]`**
Une suppression a réussi et il n'y a rien à renvoyer. Quel code ?

- a) 200 OK


**Q1.4 (QCM, 2 pts) `[CP3]`**
Parmi ces codes, lesquels sont des erreurs **du client** ?


- b) 400
- c) 404
- e) 409

**Q1.5 (QCU, 2 pts) `[CP3]`**
La route `GET /ping` existe. Un client envoie `POST /ping`. Quel code reçoit-il ?


- d) 500 Internal Server Error

---

## Section 2 - Choisir le bon code (5 min - 8 pts)

**Q2.1 (Tableau à compléter, 6 pts) `[CP3]`**
Le défi n°3 existe. Les ids doivent être des entiers. Donne le code attendu et justifie en quelques mots.

| # | Requête | Code attendu | Pourquoi ? |
| --- | --- | --- | --- |
| 1 | `GET /challenges` | 200 | lecture réussie |
| 2 | `GET /challenges/3` | | |
| 3 | `GET /challenges/999` | | |
| 4 | `GET /challenges/abc` | | |
| 5 | `POST /challenges` avec un défi valide | | |
| 6 | `POST /challenges` sans titre | | |
| 7 | `GET /challenges?category=inconnue` (liste vide) | | |

**Q2.2 (Ouverte, 2 pts) `[CP3]`**
Quelle est la différence entre `400` et `404` ? Donne un exemple de chaque avec l'API Ecoda.

>Une erreur 404 ressources not found, : une ressource qui a etait supprime, ou  une mauvais route appele
un 400 c'est une erreur style /abc alors qu'on attend un chiffre

---

## Section 3 - Premières routes Express (10 min - 10 pts)

> Écris le code ici, **puis** recopie-le dans `src/app.ts`, **avant** les deux blocs `app.use(...)` de la fin du fichier, et teste avec `curl`.

**Q3.1 (Code, 2 pts) `[CP3]`**
Écris une route `GET /ping` qui répond `{ "message": "pong" }`.

```ts
// écris ton code ici
app.get("/ping", async (req, res) => {

    res.json({ "message": "pong" });
});
```

Test :

```bash
curl http://localhost:3000/ping
```

**Q3.2 (Code, 2 pts) `[CP3]`**
Écris une route `GET /secret` qui répond toujours `401` avec `{ "error": "Unauthorized" }`.

```ts
// écris ton code iciapp

app.get("/secret", async(req, res) => {
     res.status(401).json({ error: "Unauthorized" });
})
```

Test (le `-i` affiche le code) :

```bash
curl -i http://localhost:3000/secret
```

**Q3.3 (Code, 3 pts) `[CP3]`**
Écris une route `GET /hello/:name` qui répond `{ "message": "Bonjour Lea" }` quand on appelle `/hello/Lea`.

```ts
app.get("/hello/:name", (req, res) => {
    var = name;
    const blabla =`Bonjour ${req.params.name}`;
    res.json({message:blabla});
});
```

Test :

```bash
curl http://localhost:3000/hello/Lea
```

**Q3.4 (Lecture de code, 3 pts) `[CP3]`**

```ts
app.get("/hello/:name", (_req, res) => {
    res.json({ message: `Bonjour ${req.params.name}` });
});
```

a) Cette route répond `500`. Quel message d'erreur s'affiche dans le terminal ?
b) Quelle est la correction ?

> **Réponse a) :** _(écris ta réponse ici)_
>
> **Réponse b) :** _(écris ta réponse ici)_

---

*Fin du jour 1 (25 pts). Envoie-moi tes réponses : on corrige ensemble, puis on passe au jour 2.*