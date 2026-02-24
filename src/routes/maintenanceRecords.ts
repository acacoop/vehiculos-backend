import express from "express";
import { validateUUIDParam } from "@/middleware/validation";
import { maintenanceRecordsController } from "@/controllers/maintenanceRecordsController";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = express.Router();

// TODO: Implement proper vehicle permission checking for maintenance records
// TODO: Change permission to ADMIN in the future
router.get(
  "/",
  requireRole(UserRoleEnum.USER),
  maintenanceRecordsController.getAll,
);

// TODO: Change permission to ADMIN in the future
router.get(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.USER),
  maintenanceRecordsController.getById,
);

router.post(
  "/",
  // TODO: Implement proper vehicle permission checking for maintenance record creation
  // Currently using admin-only access until vehicle permission logic is implemented
  requireRole(UserRoleEnum.ADMIN),
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
