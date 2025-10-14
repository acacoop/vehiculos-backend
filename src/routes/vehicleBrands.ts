import { Router } from "express";
import { VehicleBrandsController } from "../controllers/vehicleBrandsController";
import { validateSchema } from "../middleware/errorHandler";
import { VehicleBrandInputSchema } from "../schemas/vehicleBrand";
import { validateUUIDParam } from "../middleware/validation";
import { AppDataSource } from "../db";
import { ServiceFactory } from "../factories/serviceFactory";

const router = Router();

// Create service factory and controller with proper dependency injection
const serviceFactory = new ServiceFactory(AppDataSource);
const vehicleBrandService = serviceFactory.createVehicleBrandService();
const controller = new VehicleBrandsController(vehicleBrandService);

router.get("/", controller.getAll);
router.get("/:id", validateUUIDParam("id"), controller.getById);
router.post("/", validateSchema(VehicleBrandInputSchema), controller.create);
router.put(
  "/:id",
  validateUUIDParam("id"),
  validateSchema(VehicleBrandInputSchema.partial()),
  controller.update,
);
router.patch(
  "/:id",
  validateUUIDParam("id"),
  validateSchema(VehicleBrandInputSchema.partial()),
  controller.patch,
);
router.delete("/:id", validateUUIDParam("id"), controller.delete);

export default router;
