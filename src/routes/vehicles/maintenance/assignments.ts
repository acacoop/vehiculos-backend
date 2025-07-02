import express, { Request, Response } from "express";

import { AssignedMaintenanceSchema } from "../../../schemas/maintenance/assignMaintance";
import { AssignedMaintenance } from "../../../interfaces/maintenance";
import { validateId } from "../../../middleware/validation";
import { assignMaintenance, getAssignedMaintenancesByVehicle } from "../../../services/vehicles/maintenance/assignations";

const router = express.Router();

// GET: Fetch all maintenance for a specific vehicle
router.get("/:vehicle_id", validateId, async (req: Request, res: Response) => {
  const vehicleId = req.params.vehicle_id;

  try {
    const maintenanceRecords = await getAssignedMaintenancesByVehicle(vehicleId);
    res.status(200).json(maintenanceRecords);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// POST: Associate a maintenance with a vehicle
router.post("/", async (req: Request, res: Response) => {
  const assignedMaintenance: AssignedMaintenance = AssignedMaintenanceSchema.parse(req.body);

  try {
    const result = await assignMaintenance(assignedMaintenance);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

export default router;
