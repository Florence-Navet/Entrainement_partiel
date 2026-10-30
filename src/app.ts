import express, { NextFunction, Request, Response } from "express";
import db from "./config/db";
import redis from "./config/redis";
import { email, z } from "zod";

const app = express();



// 1. L'API répond (aucune dépendance)
app.get("/", (req, res) => {
    res.json({ message: "Hello World" });
});

// 2. L'API lit PostgreSQL et écrit dans Redis
app.get("/hello", async (req, res) => {
    const { rows } = await db.query<{ message: string }>("SELECT message FROM greetings ORDER BY id LIMIT 1");
    const visits = await redis.incr("hello:visits");

    res.json({ message: rows[0]?.message ?? null, visits });
});
app.get("/ping", (req, res) => {

    const blabla = "message: pong";
    res.json({message:blabla});

    // res.json({ "message": "pong" });
});



app.get("/secret", async(req, res) => {
     res.status(401).json({ error: "Unauthorized" });
})

app.get("/get/hello/name", (req, res) => {

    const blabla = {"message": "bonjour Lea"};
    res.json({message:blabla});
});

app.get("/lol", (req, res) => {
    res.json({ message: "lol ça va" });
});

app.get("/hello/:name", (req, res) => {
  
    const blabla =`Bonjour ${req.params.name}`;
    res.json({message:blabla});
});

const requireApikey = (req: Request, res: Response, next: NextFunction) => {
    next();
};

app.get("/admin", requireApikey,(req, res) => {  

    const response = "bienvenue admin";
    res.json({message:response});
 });


 
app.get("/items/:id", requireApikey,(req, res) => {  

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({error: "Invalid id"});
        return;
    }
    const resp = `id: id`
    res.json({message:resp});
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

const users = [];

app.post("/users", (req, res) => {
    const user = {
        id: users.length + 1,
        email: req.body.email,
        password: req.body.password,
    };

    users.push(user);

    const utilisateur = {id: user.id, email: user.email};
    res.status(201).json(utilisateur);
});


// z.string().min(1).max(140)

app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});{}

const notes : {id:number; text: string} [] = [];

const NoteSchema = z.object({
    text: z.string().min(1).max(140),
});



app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    // Ex. ECONNREFUSED : pg renvoie une AggregateError dont le message est vide
    const detail = err instanceof Error ? err.message || (err as NodeJS.ErrnoException).code : String(err);
    res.status(500).json({ error: "Internal server error", detail });
});





export default app;
