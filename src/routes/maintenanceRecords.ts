import express from "express";
import { validateUUIDParam } from "../middleware/validation";
import { maintenanceRecordsController } from "../controllers/maintenanceRecordsController";
import { PermissionType } from "../utils/common";
import { addPermissionFilter } from "../middleware/permissionFilter";
import { requireVehiclePermissionWith } from "../middleware/permission";
import {
  vehicleIdFromAssignedMaintenance,
  vehicleIdFromMaintenanceRecord,
} from "../middleware/vehicleIdMappers";

const router = express.Router();

// GET: Fetch all maintenance records with pagination and filtering
// Supports query parameters: vehicleId, maintenanceId, userId, page, limit
// Users with READ permission can view maintenance records for vehicles they have access to
router.get(
  "/",
  addPermissionFilter(PermissionType.READ),
  maintenanceRecordsController.getAll,
);

// GET: Fetch maintenance record by ID
// Users with READ permission can view records for vehicles they have access to
router.get(
  "/:id",
  validateUUIDParam("id"),
  requireVehiclePermissionWith(
    PermissionType.READ,
    vehicleIdFromMaintenanceRecord,
  ),
  maintenanceRecordsController.getById,
);

// POST: Add a new maintenance record
// Users with MAINTAINER permission or higher can create maintenance records
// Permission is checked on the vehicle associated with the assignedMaintenanceId
router.post(
  "/",
  requireVehiclePermissionWith(
    PermissionType.MAINTAINER,
    vehicleIdFromAssignedMaintenance,
  ),
  maintenanceRecordsController.create,
);

export default router;
