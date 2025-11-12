import express from "express";
import { createMaintenancePosiblesController } from "@/controllers/maintenancePosiblesController";
import { validateUUIDParam, validateBody } from "@/middleware/validation";
import {
  MaintenanceCreateSchema,
  MaintenanceUpdateSchema,
} from "@/schemas/maintenance";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = express.Router();
const controller = createMaintenancePosiblesController();

router.get("/", controller.getAll);

router.get("/:id", validateUUIDParam("id"), controller.getById);

router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  validateBody(MaintenanceCreateSchema),
  controller.create,
);

router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateBody(MaintenanceUpdateSchema),
  controller.update,
);

router.delete(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.delete,
);

export default router;
