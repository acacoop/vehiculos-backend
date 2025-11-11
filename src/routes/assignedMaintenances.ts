import express from "express";
import { validateUUIDParam } from "@/middleware/validation";
import { validateBody } from "@/middleware/validation";
import {
  AssignedMaintenanceSchema,
  UpdateAssignedMaintenanceSchema,
} from "@/schemas/assignMaintance";
import {
  requireRole,
  requireVehiclePermissionFromParam,
} from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";
import { PermissionType } from "@/enums/PermissionType";
import { assignedMaintenancesController } from "@/controllers/assignedMaintenancesController";

const router = express.Router();

router.get(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  assignedMaintenancesController.getAll,
);

router.get(
  "/:assignedMaintenanceId",
  validateUUIDParam("assignedMaintenanceId"),
  // TODO: Adjust permissions as needed
  requireRole(UserRoleEnum.ADMIN),
  assignedMaintenancesController.getById,
);

router.get(
  "/vehicle/:vehicleId",
  validateUUIDParam("vehicleId"),
  requireVehiclePermissionFromParam(PermissionType.READ, "vehicleId"),
  assignedMaintenancesController.getByVehicle,
);

router.get(
  "/maintenance/:maintenanceId",
  validateUUIDParam("maintenanceId"),
  requireRole(UserRoleEnum.ADMIN),
  assignedMaintenancesController.getByMaintenance,
);

router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  validateBody(AssignedMaintenanceSchema),
  assignedMaintenancesController.create,
);

router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateBody(UpdateAssignedMaintenanceSchema),
  assignedMaintenancesController.update,
);

router.delete(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  assignedMaintenancesController.delete,
);

export default router;
