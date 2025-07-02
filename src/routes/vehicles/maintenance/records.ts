import express, { Request, Response } from "express";
import { MaintenanceRecordSchema } from "../../../schemas/maintenance/maintanceRecord";
import {
  addMaintenanceRecord,
  getMaintenanceRecordsByVehicle,
  getMaintenanceRecordById,
} from "../../../services/vehicles/maintenance/records";
import { MaintenanceRecord } from "../../../interfaces/maintenance";
import { validateId } from "../../../middleware/validation";

const router = express.Router();

// GET: Fetch maintenance records by vehicle ID
router.get("/vehicle/:vehicleId", validateId, async (req: Request, res: Response) => {
  const vehicleId = req.params.vehicleId;

  try {
    const records = await getMaintenanceRecordsByVehicle(vehicleId);
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// GET: Fetch maintenance record by ID
router.get("/:id", validateId, async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const record = await getMaintenanceRecordById(id);
    if (!record) {
      res.status(404).json({ error: "Maintenance record not found" });
      return;
    }
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// POST: Add a new maintenance record
router.post("/", async (req: Request, res: Response) => {
  const maintenanceRecord: MaintenanceRecord = MaintenanceRecordSchema.parse(req.body);

  try {
    const record = await addMaintenanceRecord(maintenanceRecord);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

export default router;
