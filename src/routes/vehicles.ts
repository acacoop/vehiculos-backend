import { Router } from "express";
import { createVehiclesController } from "@/controllers/vehiclesController";
import { validateSchema } from "@/middleware/errorHandler";
import { validateUUIDParam } from "@/middleware/validation";
import { VehicleInputSchema, VehicleUpdateSchema } from "@/schemas/vehicle";
import {
  requireRole,
  requireVehiclePermissionFromParam,
} from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";
import { PermissionType } from "@/enums/PermissionType";

const router = Router();
const vehiclesController = createVehiclesController();

// TODO: Change permission to ADMIN in the future
router.get("/", requireRole(UserRoleEnum.USER), vehiclesController.getAll);

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

export default router;
