import { Router } from "express";
import { createVehicleBrandsController } from "../controllers/vehicleBrandsController";
import { validateSchema } from "../middleware/errorHandler";
import { VehicleBrandInputSchema } from "../schemas/vehicleBrand";
import { validateUUIDParam } from "../middleware/validation";

const router = Router();
const controller = createVehicleBrandsController();

router.get("/", controller.getAll);
router.get("/:id", validateUUIDParam("id"), controller.getById);
router.post("/", validateSchema(VehicleBrandInputSchema), controller.create);
router.put(
  "/:id",
  validateUUIDParam("id"),
  validateSchema(VehicleBrandInputSchema.partial()),
  controller.update
);
router.patch(
  "/:id",
  validateUUIDParam("id"),
  validateSchema(VehicleBrandInputSchema.partial()),
  controller.patch
);
router.delete("/:id", validateUUIDParam("id"), controller.delete);

export default router;
