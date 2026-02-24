import { Router } from "express";
import { VehicleModelsController } from "@/controllers/vehicleModelsController";
import { validateSchema } from "@/middleware/errorHandler";
import { VehicleModelInputSchema } from "@/schemas/vehicleModel";
import { validateUUIDParam } from "@/middleware/validation";
import { AppDataSource } from "@/db";
import { ServiceFactory } from "@/factories/serviceFactory";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = Router();

const serviceFactory = new ServiceFactory(AppDataSource);
const vehicleModelService = serviceFactory.createVehicleModelService();
const controller = new VehicleModelsController(vehicleModelService);

// TODO: Change permission to ADMIN in the future
router.get("/", requireRole(UserRoleEnum.USER), controller.getAll);

// TODO: Change permission to ADMIN in the future
router.get(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.USER),
  controller.getById,
);

router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  validateSchema(VehicleModelInputSchema),
  controller.create,
);

router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateSchema(VehicleModelInputSchema.partial()),
  controller.update,
);

router.delete(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.delete,
);

export default router;
