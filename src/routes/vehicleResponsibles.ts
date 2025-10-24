import express from "express";
import { createVehicleResponsiblesController } from "@/controllers/vehicleResponsiblesController";
import { validateUUIDParam } from "@/middleware/validation";
import {
  requireRole,
  requireVehiclePermissionFromParam,
  requireSelfOrAdmin,
} from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";
import { PermissionType } from "@/enums/PermissionType";

const router = express.Router();
const vehicleResponsiblesController = createVehicleResponsiblesController();

// Admin only access
router.get(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  vehicleResponsiblesController.getAll,
);

router.get(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  vehicleResponsiblesController.getById,
);

router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  vehicleResponsiblesController.create,
);

router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  vehicleResponsiblesController.update,
);

router.delete(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  vehicleResponsiblesController.delete,
);

// Custom endpoints for specific functionality
router.get(
  "/vehicle/:vehicleId/current",
  validateUUIDParam("vehicleId"),
  requireVehiclePermissionFromParam(PermissionType.READ, "vehicleId"),
  vehicleResponsiblesController.getCurrentForVehicle,
);

router.get(
  "/user/:userId/current",
  validateUUIDParam("userId"),
  requireSelfOrAdmin("userId"),
  vehicleResponsiblesController.getCurrentVehiclesForUser,
);

export default router;
