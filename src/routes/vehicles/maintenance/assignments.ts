import express from "express";
import { validateUUIDParam } from "../../../middleware/validation";
import { maintenanceAssignmentsController } from "../../../controllers/maintenanceAssignmentsController";

const router = express.Router();

// GET: Fetch all maintenance for a specific vehicle
router.get("/:vehicleId", validateUUIDParam("vehicleId"), maintenanceAssignmentsController.getByVehicle);

// POST: Associate a maintenance with a vehicle
router.post("/", maintenanceAssignmentsController.create);

export default router;
