import express, { Request, Response } from "express";
import {
  getVehicleById,
  getAllVehicles,
  addVehicle,
  getVehicleByLicensePlate,
} from "../services/vehiclesService";
import { VehicleSchema } from "../schemas/vehicle";
import { Vehicle } from "../interfaces/vehicle";
import { licensePlateRegex } from "../schemas/validations";

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
router.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

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

// GET: Fetch a vechicle by license plate

router.get(
  "/licensePlate/:licensePlate",
  async (req: Request, res: Response) => {
    const licensePlate = req.params.licensePlate;

    if (!licensePlateRegex.test(licensePlate)) {
      res.status(400).json({ error: "Invalid license plate" });
      return;
    }

    try {
      const vehicle = await getVehicleByLicensePlate(licensePlate);
      if (!vehicle) {
        res.status(404).json({ error: "Vehicle not found" });
        return;
      }
      res.status(200).json(vehicle);
    } catch (error) {
      res.status(500).json({ error: `Internal Server Error: ${error}` });
    }
  }
);

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
