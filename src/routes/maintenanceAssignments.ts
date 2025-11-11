import express from "express";
import { validateUUIDParam } from "@/middleware/validation";
import { maintenanceAssignmentsController } from "@/controllers/maintenanceAssignmentsController";
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

const router = express.Router();

router.get(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  maintenanceAssignmentsController.getAll,
);

router.get(
  "/:assignedMaintenanceId",
  validateUUIDParam("assignedMaintenanceId"),
  // TODO: Adjust permissions as needed
  requireRole(UserRoleEnum.ADMIN),
  maintenanceAssignmentsController.getById,
);

router.get(
  "/vehicle/:vehicleId",
  validateUUIDParam("vehicleId"),
  requireVehiclePermissionFromParam(PermissionType.READ, "vehicleId"),
  maintenanceAssignmentsController.getByVehicle,
);

router.get(
  "/maintenance/:maintenanceId",
  validateUUIDParam("maintenanceId"),
  requireRole(UserRoleEnum.ADMIN),
  maintenanceAssignmentsController.getByMaintenance,
);

router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  validateBody(AssignedMaintenanceSchema),
  maintenanceAssignmentsController.create,
);

router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateBody(UpdateAssignedMaintenanceSchema),
  maintenanceAssignmentsController.update,
);

router.delete(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  maintenanceAssignmentsController.delete,
);

export default router;
