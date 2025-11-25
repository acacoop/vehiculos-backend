import express from "express";
import { validateUUIDParam } from "@/middleware/validation";
import { maintenanceChecklistsController } from "@/controllers/maintenanceChecklistsController";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = express.Router();

router.get(
  "/",
  requireRole(UserRoleEnum.USER), // Permissive for viewing
  maintenanceChecklistsController.getAll,
);

router.get(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.USER), // Permissive for viewing
  maintenanceChecklistsController.getById,
);

router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  maintenanceChecklistsController.create,
);

router.post(
  "/with-items",
  requireRole(UserRoleEnum.ADMIN),
  maintenanceChecklistsController.createWithItems,
);

router.patch(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.ADMIN),
  maintenanceChecklistsController.update,
);

router.patch(
  "/:id/with-items",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.USER),
  maintenanceChecklistsController.patchWithItems,
);

router.delete(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.ADMIN),
  maintenanceChecklistsController.delete,
);

export default router;
