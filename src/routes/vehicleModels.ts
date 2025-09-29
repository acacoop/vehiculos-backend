import { Router } from "express";
import { createVehicleModelsController } from "../controllers/vehicleModelsController";
import { validateSchema } from "../middleware/errorHandler";
import { VehicleModelInputSchema } from "../schemas/vehicleModel";
import { validateUUIDParam } from "../middleware/validation";

const router = Router();
const controller = createVehicleModelsController();

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
