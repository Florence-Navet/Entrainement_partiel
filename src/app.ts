import express, { NextFunction, Request, Response } from "express";
import db from "./config/db";
import redis from "./config/redis";
import { email, z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JSONSchema } from "zod/v4/core";
import { cp } from "fs";

const app = express();
const JWT_SECRET = "your_jwt_secret";



const users: { id: number; email: string; passwordHash: string }[] = [];

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
  const blabla = "message: pong";
  res.json({ message: blabla });

  // res.json({ "message": "pong" });
});

app.get("/secret", async (req, res) => {
  res.status(401).json({ error: "Unauthorized" });
});

app.get("/get/hello/name", (req, res) => {
  const blabla = { message: "bonjour Lea" };
  res.json({ message: blabla });
});

app.get("/lol", (req, res) => {
  res.json({ message: "lol ça va" });
});

app.get("/hello/:name", (req, res) => {
  const blabla = `Bonjour ${req.params.name}`;
  res.json({ message: blabla });
});

const requireApikey = (req: Request, res: Response, next: NextFunction) => {
  next();
};

app.get("/admin", requireApikey, (req, res) => {
  const response = "bienvenue admin";
  res.json({ message: response });
});

app.get("/items/:id", requireApikey, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const resp = `id: id`;
  res.json({ message: resp });
});

app.use(express.json());

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
  const response = "la liste des notes est :";

  res.json({ message: response, notes: notes });
});



app.post("/login", async (req, res) => {

;
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


app.post("/users", async (req, res) => {
  const user = {
    id: users.length + 1,
    email: req.body.email,
    passwordHash: await bcrypt.hash(req.body.password, 10),
  };

  type User = { id: number; email: string; passwordHash: string };

  users.push(user as User);

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



app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});
{
}

const notes: { id: number; text: string }[] = [];

const NoteSchema = z.object({
  text: z.string().min(1).max(140),
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
