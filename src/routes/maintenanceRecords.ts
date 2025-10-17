import express from "express";
import { validateUUIDParam } from "../middleware/validation";
import { maintenanceRecordsController } from "../controllers/maintenanceRecordsController";
import { PermissionType } from "../utils";
import { addPermissionFilter } from "../middleware/permissionFilter";
import { requireVehiclePermissionWith } from "../middleware/permission";
import {
  vehicleIdFromAssignedMaintenance,
  vehicleIdFromMaintenanceRecord,
} from "../middleware/vehicleIdMappers";

const router = express.Router();

router.get(
  "/",
  addPermissionFilter(PermissionType.READ),
  maintenanceRecordsController.getAll,
);

router.get(
  "/:id",
  validateUUIDParam("id"),
  requireVehiclePermissionWith(
    PermissionType.READ,
    vehicleIdFromMaintenanceRecord,
  ),
  maintenanceRecordsController.getById,
);

router.post(
  "/",
  requireVehiclePermissionWith(
    PermissionType.MAINTAINER,
    vehicleIdFromAssignedMaintenance,
  ),
  maintenanceRecordsController.create,
);

export default router;
