import express from "express";
import { validateUUIDParam } from "../../../middleware/validation";
import { maintenanceAssignmentsController } from "../../../controllers/maintenanceAssignmentsController";
import { validateBody } from "../../../middleware/validation";
import {
  AssignedMaintenanceSchema,
  UpdateAssignedMaintenanceSchema,
} from "../../../schemas/maintenance/assignMaintance";

const router = express.Router();

// GET: Fetch all maintenance for a specific vehicle
router.get(
  "/:vehicleId",
  validateUUIDParam("vehicleId"),
  maintenanceAssignmentsController.getByVehicle,
);

// POST: Associate a maintenance with a vehicle
router.post(
  "/",
  validateBody(AssignedMaintenanceSchema),
  maintenanceAssignmentsController.create,
);

// PUT: Update a maintenance assignment
router.put(
  "/:id",
  validateUUIDParam("id"),
  validateBody(UpdateAssignedMaintenanceSchema),
  maintenanceAssignmentsController.update,
);

// DELETE: Remove a maintenance assignment
router.delete(
  "/:id",
  validateUUIDParam("id"),
  maintenanceAssignmentsController.delete,
);

export default router;
