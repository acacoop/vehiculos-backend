import express, { Request, Response } from "express";
import { query } from "../db";

const router = express.Router();

// GET: Fetch all users
router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await query("SELECT * FROM persons");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// POST: Add a new user
router.post("/", async (req: Request, res: Response) => {
  const { first_name, last_name, email, dni } = req.body;
  try {
    const newUser = await query(
      `INSERT INTO users (first_name, last_name, dni, email) VALUES (${first_name}, ${last_name}, ${dni}, ${email}) RETURNING *`
    );
    res.status(201).json(newUser[0]);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

export default router;
