import express from "express";
import { validateId, validateUUIDParam } from "../../../middleware/validation";
import { maintenanceRecordsController } from "../../../controllers/maintenanceRecordsController";

const router = express.Router();

// GET: Fetch all maintenance records with pagination and search
router.get("/", maintenanceRecordsController.getAll);

// GET: Fetch maintenance records by vehicle ID
router.get("/vehicle/:vehicleId", validateUUIDParam("vehicleId"), maintenanceRecordsController.getByVehicle);

// GET: Fetch maintenance record by ID
router.get("/:id", validateId, maintenanceRecordsController.getById);

// POST: Add a new maintenance record
router.post("/", maintenanceRecordsController.create);

export default router;
