import express, { Request, Response } from "express";
import {
  getVehicleById,
  getAllVehicles,
  addVehicle,
} from "../../services/vehicles/vehiclesService";
import { VehicleSchema } from "../../schemas/vehicle";
import type { Vehicle } from "../../types";
import { validateId } from "../../middleware/validation";

const router = express.Router();

// GET: Fetch all vehicles
router.get("/", async (req: Request, res: Response) => {
  try {
    const vehicles = await getAllVehicles();
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// GET: Fetch a vechicle by id
router.get("/:id", validateId, async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const vehicle = await getVehicleById(id);
    if (!vehicle) {
      res.status(404).json({ error: "Vehicle not found" });
      return;
    }
    res.status(200).json(vehicle);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// POST: Add a new vehicle
router.post("/", async (req: Request, res: Response) => {
  const vehicle: Vehicle = VehicleSchema.parse(req.body);

  try {
    const newVehicle = await addVehicle(vehicle);
    if (!newVehicle) {
      res.status(400).json({ error: "Vehicle not created" });
      return;
    }
    res.status(201).json(newVehicle);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

export default router;
