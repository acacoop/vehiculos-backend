import express from "express";
import { validateUUIDParam } from "@/middleware/validation";
import { maintenanceChecklistItemsController } from "@/controllers/maintenanceChecklistItemsController";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = express.Router();

router.get(
  "/",
  requireRole(UserRoleEnum.USER), // Permissive for viewing
  maintenanceChecklistItemsController.getAll,
);

router.get(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.USER), // Permissive for viewing
  maintenanceChecklistItemsController.getById,
);

router.post(
  "/",
  requireRole(UserRoleEnum.USER), // Permissive for creating items
  maintenanceChecklistItemsController.create,
);

router.post(
  "/bulk",
  requireRole(UserRoleEnum.USER), // Permissive for bulk creation
  maintenanceChecklistItemsController.createBulk,
);

router.patch(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.USER), // Permissive for updating
  maintenanceChecklistItemsController.update,
);

router.delete(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.ADMIN),
  maintenanceChecklistItemsController.delete,
);

export default router;
