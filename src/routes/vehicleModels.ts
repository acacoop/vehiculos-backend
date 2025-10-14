import { Router } from "express";
import { VehicleModelsController } from "../controllers/vehicleModelsController";
import { validateSchema } from "../middleware/errorHandler";
import { VehicleModelInputSchema } from "../schemas/vehicleModel";
import { validateUUIDParam } from "../middleware/validation";
import { AppDataSource } from "../db";
import { ServiceFactory } from "../factories/serviceFactory";

const router = Router();

// Create service factory and controller with proper dependency injection
const serviceFactory = new ServiceFactory(AppDataSource);
const vehicleModelService = serviceFactory.createVehicleModelService();
const controller = new VehicleModelsController(vehicleModelService);

router.get("/", controller.getAll);
router.get("/:id", validateUUIDParam("id"), controller.getById);
router.post("/", validateSchema(VehicleModelInputSchema), controller.create);
router.put(
  "/:id",
  validateUUIDParam("id"),
  validateSchema(VehicleModelInputSchema.partial()),
  controller.update,
);
router.patch(
  "/:id",
  validateUUIDParam("id"),
  validateSchema(VehicleModelInputSchema.partial()),
  controller.patch,
);
router.delete("/:id", validateUUIDParam("id"), controller.delete);

export default router;
