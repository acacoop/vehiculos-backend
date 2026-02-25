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

// TODO: Change permission to ADMIN in the future
router.get(
  "/",
  requireRole(UserRoleEnum.USER),
  vehicleResponsiblesController.getAll,
);

// TODO: Change permission to ADMIN in the future
router.get(
  "/:id",
  requireRole(UserRoleEnum.USER),
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
