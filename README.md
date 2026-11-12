# EC04 — Hello World (vérification de la stack)

Mini API **jetable** à lancer **avant l'épreuve** pour vérifier que votre poste est prêt : Docker Compose, Node.js, PostgreSQL et Redis.
Elle reprend exactement la même stack que le socle [`EC04-api-securisee-documentee-nosql`](../EC04-api-securisee-documentee-nosql) (Express 5 / TypeScript, `pg`, `ioredis`), sans aucune logique métier.

Si les 3 vérifications ci-dessous passent, votre environnement est prêt pour l'EC04.

## Prérequis

- Docker Desktop (ou Docker Engine + plugin Compose) **démarré**
- Node.js 20+ et npm
- Les ports `3000`, `5432` et `6379` libres (arrêtez les autres conteneurs PostgreSQL/Redis éventuels)

## Étape 1 : tout dans Docker Compose

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps          # les 3 services doivent être "running" / "healthy"
```

Puis :

```bash
curl http://localhost:3000/
# {"message":"Hello World"}                                   -> l'API répond

curl http://localhost:3000/hello
# {"message":"Hello World from PostgreSQL 🌱","visits":1}       -> API -> PostgreSQL + Redis
```

Relancez `/hello` : `visits` doit s'incrémenter (compteur stocké dans Redis).

## Étape 2 : l'API en local, la base dans Docker

C'est le mode de travail utilisé pendant l'épreuve (`npm run dev` + `docker compose` pour PostgreSQL et Redis).

```bash
docker compose stop api    # libère le port 3000
npm install
npm run dev
curl http://localhost:3000/hello
```

Même réponse attendue, avec `visits` qui continue de s'incrémenter.

## Étape 3 : nettoyage

```bash
docker compose down -v     # supprime conteneurs + volume PostgreSQL
```

> ⚠️ Pensez à le faire avant de lancer le socle EC04 : les deux projets utilisent les mêmes ports.

## Routes

| Route        | Vérifie                                                        |
|--------------|----------------------------------------------------------------|
| `GET /`      | L'API Express démarre et répond                                |
| `GET /hello` | Lecture dans PostgreSQL (table `greetings`) + `INCR` dans Redis |

En cas d'échec, `/hello` renvoie une `500` avec le message d'erreur dans `detail` pour faciliter le diagnostic.

## Problèmes fréquents

| Symptôme                                                    | Piste                                                                                      |
|-------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| `Cannot connect to the Docker daemon`                       | Docker Desktop n'est pas lancé                                                             |
| `port is already allocated` / `EADDRINUSE`                  | Un autre PostgreSQL, Redis ou API tourne déjà sur ce port : arrêtez-le ou changez le port dans `.env` |
| `ECONNREFUSED 127.0.0.1:5432` en `npm run dev`              | Les conteneurs `db` / `redis` ne tournent pas : `docker compose up -d db redis`             |
| `relation "greetings" does not exist`                       | Le volume existait déjà avant le script d'init : `docker compose down -v` puis relancer    |
| `password authentication failed`                            | `.env` modifié après la création du volume : `docker compose down -v` puis relancer        |


# faire des curl 

1. pour se logguer

```bash
curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d '{"email":"lea@ecoda.fr","password":"secret123"}'
curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"email":"lea@ecoda.fr","password":"secret123"}'
```

2. creer son token provisoire session

```bash
TOKEN=""
```

3. utiliser un post avec token session

```bash
curl -i -X POST http://localhost:3000/challenges/1/complete -H "Authorization: Bearer $TOKEN"
```

4. aller dans la console redis
```bash
docker compose exec redis redis-cli
```


```redis
ZREVRANGE leaderboard 0 -1 WITHSCORES
```
resultat attendu : 
SET points:1 10

5. Supprimer une cles
KEYS completed:*
puis 
DEL completed:numero cle