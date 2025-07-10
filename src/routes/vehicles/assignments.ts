import express, { Request, Response } from "express";
import {
  addAssignment,
  getAllAssignments,
  getUsersAssignedByVehicleId,
  getVehiclesAssignedByUserId,
} from "../../services/vehicles/assignments";

const router = express.Router();

// GET: Fetch all assignments
router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await getAllAssignments();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// GET: Fetch assinations for a specific user
router.get("/user/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  
  try {
    const vehicles = await getVehiclesAssignedByUserId(id);
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// GET: Fetch assinations for a specific vehicle
router.get("/vehicle/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  
  try {
    const vehicles = await getUsersAssignedByVehicleId(id);
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// POST: Create a new assignment
router.post("/", async (req: Request, res: Response) => {
  const { userId, vehicleId, startDate, endDate } = req.body;
  if (!userId || !vehicleId) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    const assignment = await addAssignment({ userId, vehicleId, startDate, endDate });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

export default router;
