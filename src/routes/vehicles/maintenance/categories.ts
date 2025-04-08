import { getAllMaintenancesCategories } from "../../../services/vehicles/maintenance/categories";
import express, { Request, Response } from "express";

const router = express.Router();

// GET: Fetch all maintenance records
router.get("/", async (req: Request, res: Response) => {
  try {
    const maintenanceRecords = await getAllMaintenancesCategories();
    res.status(200).json(maintenanceRecords);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

export default router;
