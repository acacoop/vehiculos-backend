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
import { UserRoleEnum } from "../entities/UserRoleEnum";
import { PermissionType } from "../entities/PermissionType";
import { addPermissionFilter } from "../middleware/permissionFilter";

const router = Router();
// Each router instance gets its own controller (and underlying service/repository instances)
const vehiclesController = createVehiclesController();

// GET /vehicles - Get all vehicles with pagination and search
// Supports query parameters: page, limit, license-plate, brand, model, year
// Examples:
// - /vehicles?license-plate=AAA-123
// - /vehicles?brand=Toyota&model=Corolla
// - /vehicles?year=2020&page=1&limit=5
// If user is authenticated:
//   - Admin users see all vehicles
//   - Regular users see only vehicles they have permission to access (via ACLs, assignments, or responsibles)
router.get(
  "/",
  addPermissionFilter(PermissionType.READ),
  vehiclesController.getAll,
);

// GET /vehicles/:id - Get vehicle by ID
router.get(
  "/:id",
  validateUUIDParam("id"),
  requireVehiclePermissionFromParam(PermissionType.READ, "id"),
  vehiclesController.getById,
);

// POST /vehicles - Create new vehicle (validate input schema)
router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  validateSchema(VehicleInputSchema),
  vehiclesController.create,
);

// PUT /vehicles/:id - Update vehicle (replace) - requires FULL permission on specific vehicle
router.put(
  "/:id",
  validateUUIDParam("id"),
  requireVehiclePermissionFromParam(PermissionType.FULL, "id"),
  validateSchema(VehicleUpdateSchema),
  vehiclesController.update,
);

// PATCH /vehicles/:id - Partial update vehicle - requires FULL permission on specific vehicle
router.patch(
  "/:id",
  validateUUIDParam("id"),
  requireVehiclePermissionFromParam(PermissionType.FULL, "id"),
  validateSchema(VehicleUpdateSchema),
  vehiclesController.patch,
);

// DELETE /vehicles/:id - Delete vehicle - requires FULL permission on specific vehicle
router.delete(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  vehiclesController.delete,
);

// Nested kilometers routes for a vehicle
router.use("/:id/kilometers", vehicleKilometersRoutes);

export default router;
