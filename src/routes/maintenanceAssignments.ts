import express from "express";
import { validateUUIDParam } from "../middleware/validation";
import { maintenanceAssignmentsController } from "../controllers/maintenanceAssignmentsController";
import { validateBody } from "../middleware/validation";
import {
  AssignedMaintenanceSchema,
  UpdateAssignedMaintenanceSchema,
} from "../schemas/assignMaintance";
import {
  requireRole,
  requireVehiclePermissionFromParam,
} from "../middleware/permission";
import { UserRoleEnum } from "../utils/common";
import { PermissionType } from "../utils/common";

const router = express.Router();

// GET: Fetch all maintenance for a specific vehicle
// Users with READ permission can view maintenance assignments for vehicles they have access to
router.get(
  "/:vehicleId",
  validateUUIDParam("vehicleId"),
  requireVehiclePermissionFromParam(PermissionType.READ, "vehicleId"),
  maintenanceAssignmentsController.getByVehicle,
);

// POST: Associate a maintenance with a vehicle
// Only admins can assign maintenance to vehicles
router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  validateBody(AssignedMaintenanceSchema),
  maintenanceAssignmentsController.create,
);

// PUT: Update a maintenance assignment
// Only admins can update maintenance assignments
router.put(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateBody(UpdateAssignedMaintenanceSchema),
  maintenanceAssignmentsController.update,
);

// DELETE: Remove a maintenance assignment
// Only admins can remove maintenance assignments
router.delete(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  maintenanceAssignmentsController.delete,
);

export default router;
