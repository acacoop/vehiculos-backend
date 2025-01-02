import express, { Request, Response } from "express";
import { getUserById, getAllUsers, addUser } from "../services/usersService";
import { User } from "../interfaces/user";
import { UserSchema } from "../schemas/user";

const router = express.Router();

// GET: Fetch all users
router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// GET: Fetch a user by id
router.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const user = await getUserById(id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// POST: Add a new user
router.post("/", async (req: Request, res: Response) => {
  const user: User = UserSchema.parse(req.body);

  try {
    const newUser = await addUser(user);
    if (!newUser) {
      res.status(400).json({ error: "User not created" });
      return;
    }

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

export default router;
