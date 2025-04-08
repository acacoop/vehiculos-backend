import express, { Request, Response } from "express";
import { MaintenanceRecordSchema } from "../../../schemas/maintenance/maintanceRecord";
import {
  addMaintenanceRecord,
  getAllMaintenanceRecords,
  getMaintenanceRecordsByAssignedMaintenanceId,
} from "../../../services/vehicles/maintenance/records";

const router = express.Router();

// GET: Fetch all maintenance records
router.get("/", async (req: Request, res: Response) => {
  try {
    const records = await getAllMaintenanceRecords();
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// GET: Fetch all maintanance for a assined maintenance to a vehicle
router.get("/assignedMaintenance/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const records = await getMaintenanceRecordsByAssignedMaintenanceId(id);
    if (!records) {
      res.status(404).json({
        error: "No maintenance records found for this assigned maintenance",
      });
      return;
    }
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// POST: Add a new maintenance record
router.post("/", async (req: Request, res: Response) => {
  const maintenanceRecord = MaintenanceRecordSchema.parse(req.body);

  try {
    const record = await addMaintenanceRecord(maintenanceRecord);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

export default router;
