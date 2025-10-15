import express from "express";
import { createVehicleResponsiblesController } from "../controllers/vehicleResponsiblesController";
import { validateUUIDParam } from "../middleware/validation";
import {
  requireRole,
  requireVehiclePermissionFromParam,
  requireSelfOrAdmin,
} from "../middleware/permission";
import { UserRoleEnum } from "../utils/common";
import { PermissionType } from "../utils/common";
import { addPermissionFilter } from "../middleware/permissionFilter";

const router = express.Router();
const vehicleResponsiblesController = createVehicleResponsiblesController();

// Standard CRUD endpoints using BaseController
router.get(
  "/",
  addPermissionFilter(PermissionType.READ),
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

router.put(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  vehicleResponsiblesController.update,
);

router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  vehicleResponsiblesController.patch,
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

// GET: Fetch current vehicles for a user
// Users can view their own data, or admins can view any user's data
router.get(
  "/user/:userId/current",
  validateUUIDParam("userId"),
  requireSelfOrAdmin("userId"),
  vehicleResponsiblesController.getCurrentVehiclesForUser,
);

export default router;
