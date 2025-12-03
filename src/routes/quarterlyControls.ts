import express from "express";
import { validateUUIDParam } from "@/middleware/validation";
import { quarterlyControlsController } from "@/controllers/quarterlyControlsController";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = express.Router();

router.get(
  "/",
  requireRole(UserRoleEnum.USER), // Permissive for viewing
  quarterlyControlsController.getAll,
);

router.get(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.USER), // Permissive for viewing
  quarterlyControlsController.getById,
);

router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  quarterlyControlsController.create,
);

router.post(
  "/with-items",
  requireRole(UserRoleEnum.ADMIN),
  quarterlyControlsController.createWithItems,
);

router.patch(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.ADMIN),
  quarterlyControlsController.update,
);

router.patch(
  "/:id/with-items",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.USER),
  quarterlyControlsController.patchWithItems,
);

router.delete(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.ADMIN),
  quarterlyControlsController.delete,
);

export default router;
