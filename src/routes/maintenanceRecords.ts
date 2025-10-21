import express from "express";
import { validateUUIDParam } from "@/middleware/validation";
import { maintenanceRecordsController } from "@/controllers/maintenanceRecordsController";
import { PermissionType } from "@/utils";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/utils";
import { requireVehiclePermissionWith } from "@/middleware/permission";
import {
  vehicleIdFromAssignedMaintenance,
  vehicleIdFromMaintenanceRecord,
} from "@/middleware/vehicleIdMappers";

const router = express.Router();

router.get(
  "/",
  requireRole(UserRoleEnum.ADMIN),
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
