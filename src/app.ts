import express, { NextFunction, Request, Response } from "express";
import db from "./config/db";
import redis from "./config/redis";

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

app.get("/hello/:name", (req, res) => {
  
    const blabla =`Bonjour ${req.params.name}`;
    res.json({message:blabla});
});

app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    // Ex. ECONNREFUSED : pg renvoie une AggregateError dont le message est vide
    const detail = err instanceof Error ? err.message || (err as NodeJS.ErrnoException).code : String(err);
    res.status(500).json({ error: "Internal server error", detail });
});





export default app;
