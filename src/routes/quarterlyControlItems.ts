import express from "express";
import { validateUUIDParam } from "@/middleware/validation";
import { quarterlyControlItemsController } from "@/controllers/quarterlyControlItemsController";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = express.Router();

router.get(
  "/",
  requireRole(UserRoleEnum.USER), // Permissive for viewing
  quarterlyControlItemsController.getAll,
);

router.get(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.USER), // Permissive for viewing
  quarterlyControlItemsController.getById,
);

router.post(
  "/",
  requireRole(UserRoleEnum.USER), // Permissive for creating items
  quarterlyControlItemsController.create,
);

router.patch(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.USER), // Permissive for updating
  quarterlyControlItemsController.update,
);

router.delete(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.ADMIN),
  quarterlyControlItemsController.delete,
);

export default router;
