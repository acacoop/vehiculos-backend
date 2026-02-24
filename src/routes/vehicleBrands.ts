import { Router } from "express";
import { VehicleBrandsController } from "@/controllers/vehicleBrandsController";
import { validateSchema } from "@/middleware/errorHandler";
import { VehicleBrandInputSchema } from "@/schemas/vehicleBrand";
import { validateUUIDParam } from "@/middleware/validation";
import { AppDataSource } from "@/db";
import { ServiceFactory } from "@/factories/serviceFactory";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = Router();

const serviceFactory = new ServiceFactory(AppDataSource);
const vehicleBrandService = serviceFactory.createVehicleBrandService();
const controller = new VehicleBrandsController(vehicleBrandService);

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
  validateSchema(VehicleBrandInputSchema),
  controller.create,
);

router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateSchema(VehicleBrandInputSchema.partial()),
  controller.update,
);

router.delete(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.delete,
);

export default router;
