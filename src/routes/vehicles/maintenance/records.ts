import express from "express";
import { validateId } from "../../../middleware/validation";
import { maintenanceRecordsController } from "../../../controllers/maintenanceRecordsController";

const router = express.Router();

// GET: Fetch all maintenance records with pagination and filtering
// Supports query parameters: vehicleId, maintenanceId, userId, page, limit
router.get("/", maintenanceRecordsController.getAll);

// GET: Fetch maintenance record by ID
router.get("/:id", validateId, maintenanceRecordsController.getById);

// POST: Add a new maintenance record
router.post("/", maintenanceRecordsController.create);

export default router;
