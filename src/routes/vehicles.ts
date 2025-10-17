import { Router } from "express";
import { createVehiclesController } from "../controllers/vehiclesController";
import vehicleKilometersRoutes from "./vehicleKilometers";
import { validateSchema } from "../middleware/errorHandler";
import { validateUUIDParam } from "../middleware/validation";
import { VehicleInputSchema, VehicleUpdateSchema } from "../schemas/vehicle";
import {
  requireRole,
  requireVehiclePermissionFromParam,
} from "../middleware/permission";
import { UserRoleEnum } from "../utils";
import { PermissionType } from "../utils";
import { addPermissionFilter } from "../middleware/permissionFilter";

const router = Router();
const vehiclesController = createVehiclesController();

// If user is authenticated:
//   - Admin users see all vehicles
//   - Regular users see only vehicles they have permission to access (via ACLs, assignments, or responsibles)
router.get(
  "/",
  addPermissionFilter(PermissionType.READ),
  vehiclesController.getAll,
);

router.get(
  "/:id",
  validateUUIDParam("id"),
  requireVehiclePermissionFromParam(PermissionType.READ, "id"),
  vehiclesController.getById,
);

router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  validateSchema(VehicleInputSchema),
  vehiclesController.create,
);

router.patch(
  "/:id",
  validateUUIDParam("id"),
  requireVehiclePermissionFromParam(PermissionType.FULL, "id"),
  validateSchema(VehicleUpdateSchema),
  vehiclesController.update,
);

router.delete(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  vehiclesController.delete,
);

router.use("/:id/kilometers", vehicleKilometersRoutes);

export default router;
