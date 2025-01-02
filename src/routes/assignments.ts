import express, { Request, Response } from "express";
import {
  addAssignment,
  getAllAssignments,
  getUsersAssignedByVehicleId,
  getVehiclesAssignedByUserId,
} from "../services/assignmentsService";

const router = express.Router();

// GET: Fetch all users
router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await getAllAssignments();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// GET: Fetch assinations for a specific user
router.get("/user/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const vehicles = await getVehiclesAssignedByUserId(id);
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// GET: Fetch assinations for a specific vehicle
router.get("/vehicle/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const vehicles = await getUsersAssignedByVehicleId(id);
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// POST: Create a new assignment
router.post("/", async (req: Request, res: Response) => {
  const { userId, vehicleId } = req.body;
  if (!userId || !vehicleId) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    const assignment = await addAssignment(userId, vehicleId);
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

export default router;
