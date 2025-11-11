import express from "express";
import { validateUUIDParam } from "@/middleware/validation";
import { maintenanceRecordsController } from "@/controllers/maintenanceRecordsController";
import { PermissionType } from "@/enums/PermissionType";
import {
  requireRole,
  requireEntityVehiclePermission,
} from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";

const router = express.Router();

router.get(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  maintenanceRecordsController.getAll,
);

router.get(
  "/:id",
  validateUUIDParam("id"),
  requireEntityVehiclePermission(
    new ServiceFactory(AppDataSource).createMaintenanceRecordsService(),
    PermissionType.READ,
  ),
  maintenanceRecordsController.getById,
);

router.post(
  "/",
  requireEntityVehiclePermission(
    new ServiceFactory(AppDataSource).createAssignedMaintenancesService(),
    PermissionType.MAINTAINER,
    "getWithDetailsById",
  ),
  maintenanceRecordsController.create,
);

export default router;
