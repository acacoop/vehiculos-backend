import express, { Request, Response } from "express";
import {
  associateMaintenanceWithVehicle,
  getMaintenancesByVehicleId,
} from "../../../services/vehicles/maintenance/assignations";
import { AssignedMaintenanceSchema } from "../../../schemas/maintenance/assignMaintance";

const router = express.Router();

// GET: Fetch all maintenance for a specific vehicle
router.get("/:vehicle_id", async (req: Request, res: Response) => {
  const vehicleId = parseInt(req.params.vehicle_id);
  if (isNaN(vehicleId)) {
    res.status(400).json({ error: "Invalid vehicle ID" });
    return;
  }

  try {
    const maintenanceRecords = await getMaintenancesByVehicleId(vehicleId);
    res.status(200).json(maintenanceRecords);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// POST: Associate a maintenance with a vehicle
router.post("/", async (req: Request, res: Response) => {
  const assignedMaintenance = AssignedMaintenanceSchema.parse(req.body);

  try {
    // Assuming you have a function to associate maintenance with a vehicle
    await associateMaintenanceWithVehicle(assignedMaintenance);
    res.status(201).json({ message: "Maintenance associated successfully" });
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

export default router;
