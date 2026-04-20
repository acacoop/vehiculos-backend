import express from "express";
import { validateUUIDParam } from "@/middleware/validation";
import { maintenanceRecordsController } from "@/controllers/maintenanceRecordsController";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = express.Router();

router.get(
  "/",
  requireRole(UserRoleEnum.USER),
  maintenanceRecordsController.getAll,
);

router.get(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.USER),
  maintenanceRecordsController.getById,
);

router.post(
  "/",
  requireRole(UserRoleEnum.USER),
  maintenanceRecordsController.create,
);

router.patch(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.ADMIN),
  maintenanceRecordsController.update,
);

router.delete(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.ADMIN),
  maintenanceRecordsController.delete,
);

export default router;
