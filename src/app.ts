import express, { NextFunction, Request, Response } from "express";
import db from "./config/db";
import redis from "./config/redis";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import YAML from "yaml";
import swaggerUi from "swagger-ui-express";
import { id } from "zod/v4/locales";



const app = express();

app.use(express.json());

const openapiDocument = YAML.parse(fs.readFileSync("openapi.yaml", "utf8"));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

const JWT_SECRET = "your_jwt_secret";



const users: { id: number; email: string; passwordHash: string }[] = [];

type Challenge = { id: number; title: string; category: string; points: number };

const challenges: Challenge[] = [
  { id: 1, title: "Se déplacer à vélo", category: "carbone", points: 10 },
  { id: 2, title: "Repas 100 % végétarien", category: "alimentation", points: 10 },
  { id: 3, title: "Faire un trajet en covoiturage", category: "carbone", points: 20 },
];

const PointSchema = z.object({
    points: z.number().positive(),

});

const ChallengeSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  points: z.number().positive(),
});
const notes: { id: number; text: string }[] = [];

const NoteSchema = z.object({
  text: z.string().min(1).max(140),
});

const RegisterSchema = z.object({
    email: z.string(),
  password: z.string().min(8),

}); 

// 1. L'API répond (aucune dépendance)
app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

// 2. L'API lit PostgreSQL et écrit dans Redis
app.get("/hello", async (req, res) => {
  const { rows } = await db.query<{ message: string }>(
    "SELECT message FROM greetings ORDER BY id LIMIT 1",
  );
  const visits = await redis.incr("hello:visits");

  res.json({ message: rows[0]?.message ?? null, visits });
});
app.get("/ping", (req, res) => {
  const blabla = "pong";
  res.json({ message: blabla });

  // res.json({ "message": "pong" });
});

app.get("/secret", async (req, res) => {
  res.status(401).json({ error: "Unauthorized" });
});

app.get("/lol", (req, res) => {
  res.json({ message: "lol ça va" });
});

app.get("/hello/:name", (req, res) => {
  const response = `Bonjour ${req.params.name}`;
  res.json({ message: response });
});

const requireApikey = (req: Request, res: Response, next: NextFunction) => {
      if (req.headers["x-api-key"] !== "secret123") {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
  next();
};

app.get("/admin", requireApikey, (req, res) => {
  const response = "bienvenue admin";
  res.json({ message: response });
});

const parseIdParam =(req:Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  res.locals.id = id;
  next();
}

app.get("/items/:id", parseIdParam, (req, res) => {
  res.json({ id: res.locals.id });
});



app.post("/notes", async (req, res) => {
  const result = NoteSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues });
    return;
  }

  const note = { id: notes.length + 1, text: result.data.text };
  notes.push(note);

  await redis.del("cache:notes");
  res.status(201).json(note);
});

app.get("/notes", async (req, res) => {
   const cached = await redis.get("cache:notes");

  if (cached) {

    res.set("X-Cache", "HIT");
    res.json({ message: "la liste des notes est :", notes: JSON.parse(cached) });
    return;
  }

  res.set("X-Cache", "MISS");
  await redis.set("cache:notes", JSON.stringify(notes), "EX", 60);

  const response = "la liste des notes est :";

  res.json({ message: response, notes: notes });
});


const limitLogin = async (req: Request, res: Response, next: NextFunction) => {
 const key = `ratelimit:login:${req.ip}`;
 const count = await redis.incr(key);
 if (count === 1) {
   await redis.expire(key, 60);
 }
 if (count > 5) {
  const ttl = await redis.ttl(key);
   res.set("Retry-After", String(ttl));
   res.status(429).json({ error: "Too many requests" });
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
  res.status(200).json({ accessToken: token,  tokenType: "Bearer", expiresIn: 3600 });
});


app.post("/users", async (req, res) => {
  const result = RegisterSchema.safeParse(req.body);
  if(!result.success) {
    res.status(400).json({errors: result.error.issues});
    return;
  };

  const user = {
    id: users.length + 1,
    email: result.data.email,
    passwordHash: await bcrypt.hash(result.data.password, 10),
  };

  users.push(user);

  const utilisateur = { id: user.id, email: user.email };
  res.status(201).json(utilisateur);
});

// z.string().min(1).max(140)
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

    app.get("/me", requireAuth, (req, res) => {
      const response = "hello me";
      res.json({ message: response, user: res.locals.user });
    });

    app.get("/me/points", requireAuth,async(req, res) => {
      const userId = res.locals.user.sub;

      const key = `points:${userId}`;
      const stored = await redis.get(key);
      console.log(stored);
        res.status(200).json({"totalPoints": Number(stored ?? 0)});
    });



        app.get("/visits", async (req, res) => {
      const visits = await redis.incr("visits");
      for (let i = 0; i < visits; i++) {
        console.log(`Visit number: ${i}`);
      }

      res.json({ message: "merci pour les visites", visits })
    });



    app.get("/announcement", async (req, res) => {
      const text = await redis.get("announcement");

      if (!text) {
        res.status(404).json({ error: "No announcement" });
        return;
      }



  res.status(200).json({ text:text});

});

app.post("/announcement", async (req, res) => {
  console.log(req.body.text);
  const text = req.body.text;
  await  redis.set("announcement" , text, "EX", 30);

  res.status(201).json({ text:text, expiresIn: 30 });

 
});

app.patch("/challenges/:id", requireAuth, parseIdParam, async (req, res) => {

  const result = PointSchema.safeParse(req.body);
  const response = res.locals.id;
  const challenge = challenges.find((c) => c.id === response);
  if(!result.success) {
    res.status(400).json({errors:result.error.issues});
    return;
  }
  if(!challenge) {
    res.status(404).json({error:"Challenge not found"});
    return;
  }
  challenge.points = result.data.points;
  await redis.del("cache:challenges");

  // const message = "message ok";
  res.status(200).json(challenge);

});

app.get("/challenges", async (req, res) => {
  const category = req.query.category;

  if (category) {
    res.json(challenges.filter((challenge) => challenge.category === category));
    return;
  }
      const cached = await redis.get("cache:challenges");
    if (cached) {
      res.set("X-Cache", "HIT");
      res.json({message:"la liste des challenges est:", challenges: JSON.parse(cached)});
      return;
    }
  res.set("X-Cache", "MISS");
  await redis.set("cache:challenges", JSON.stringify(challenges), "EX", 60);

  const response = "la liste des challenges est:";

  res.json({message: response, challenges});

});


app.get("/challenges/:id", parseIdParam, (req, res) => {
const response = res.locals.id;
  const challenge = challenges.find(c => c.id === response);
  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  res.json(challenge);
});

app.post("/challenges", async (req, res) => {

  const result = ChallengeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({errors:result.error.issues});
    return;
  }

  const challenge = {
  id: challenges.length + 1,
  title: result.data.title,
  category: result.data.category,
  points: result.data.points
  }
  challenges.push(challenge);
    await redis.del("cache:challenges");
  res.status(201).json({ message: "Challenge created", challenge });
});

app.post("/challenges/:id/complete", requireAuth, parseIdParam, async (req, res) => {

  const challenge = challenges.find(c => c.id === res.locals.id);
  
  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });

    return;
  }

  const userId = res.locals.user.sub;
  const today = new Date().toISOString().slice(0, 10);
  const key = `completed:${userId}:${challenge.id}:${today}`;
  console.log(key);
  
  const alreadyDone = await redis.get(key);
  if (alreadyDone) {
    res.status(409).json({ error: "Challenge already completed today" });
    return;
  }
  await redis.set(key, "done", "EX", 86400); 
  const totalPoints = await redis.incrby(`points:${userId}`, challenge.points);
  await redis.zincrby("leaderboard", challenge.points, userId);
  
  res.status(201).json({challengeId: challenge.id, points: challenge.points, totalPoints});

});

app.get("/leaderboard", async(req, res) => {
  const limit = Number(req.query.limit ?? 3);
 ;


  console.log(limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
      res.status(400).json({ error: "limit must be between 1 and 10" });
    return;
  }

 const raw = await redis.zrevrange("leaderboard",0 , limit - 1,"WITHSCORES")
  console.log(raw);
  const ranking = [];
  for (let i = 0; i< raw.length; i = i+2) {
    ranking.push({userId: raw[i], points: Number(raw[i+1])});

  }
    res.status(200).json({message: "rang", ranking});
});

app.delete("/challenges/:id", requireAuth, parseIdParam, async (req, res) => {

    const index = challenges.findIndex((c) => c.id === res.locals.id);

    if (index === -1) {
        res.status(404).json({error:"Challenge not found"});
        return;
    }
    challenges.splice(index, 1);
    
    await redis.del("cache:challenges");
    res.status(204).send();

});


app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});




app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  // Ex. ECONNREFUSED : pg renvoie une AggregateError dont le message est vide
  const detail =
    err instanceof Error
      ? err.message || (err as NodeJS.ErrnoException).code
      : String(err);
  res.status(500).json({ error: "Internal server error", detail });
});

export default app;
