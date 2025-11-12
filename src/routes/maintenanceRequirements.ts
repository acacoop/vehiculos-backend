import express from "express";
import { validateUUIDParam } from "@/middleware/validation";
import { validateBody } from "@/middleware/validation";
import {
  MaintenanceRequirementSchema,
  UpdateMaintenanceRequirementSchema,
} from "@/schemas/maintenanceRequirement";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";
import { maintenanceRequirementsController } from "@/controllers/maintenanceRequirementsController";

const router = express.Router();

router.get(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  maintenanceRequirementsController.getAll,
);

router.get(
  "/:maintenanceRequirementId",
  validateUUIDParam("maintenanceRequirementId"),
  requireRole(UserRoleEnum.ADMIN),
  maintenanceRequirementsController.getById,
);

router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  validateBody(MaintenanceRequirementSchema),
  maintenanceRequirementsController.create,
);

router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateBody(UpdateMaintenanceRequirementSchema),
  maintenanceRequirementsController.update,
);

router.delete(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  maintenanceRequirementsController.delete,
);

export default router;
