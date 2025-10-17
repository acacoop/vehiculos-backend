import { Router } from "express";
import { VehicleBrandsController } from "../controllers/vehicleBrandsController";
import { validateSchema } from "../middleware/errorHandler";
import { VehicleBrandInputSchema } from "../schemas/vehicleBrand";
import { validateUUIDParam } from "../middleware/validation";
import { AppDataSource } from "../db";
import { ServiceFactory } from "../factories/serviceFactory";
import { requireRole } from "../middleware/permission";
import { UserRoleEnum } from "../utils";

const router = Router();

const serviceFactory = new ServiceFactory(AppDataSource);
const vehicleBrandService = serviceFactory.createVehicleBrandService();
const controller = new VehicleBrandsController(vehicleBrandService);

router.get("/", controller.getAll);

router.get("/:id", validateUUIDParam("id"), controller.getById);

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
