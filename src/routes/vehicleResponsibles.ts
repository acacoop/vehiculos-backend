import express from "express";
import { createVehicleResponsiblesController } from "../controllers/vehicleResponsiblesController";
import { validateUUIDParam } from "../middleware/validation";

const router = express.Router();
const vehicleResponsiblesController = createVehicleResponsiblesController();

// Standard CRUD endpoints using BaseController
router.get("/", vehicleResponsiblesController.getAll);
router.get("/:id", vehicleResponsiblesController.getById);
router.post("/", vehicleResponsiblesController.create);
router.put("/:id", vehicleResponsiblesController.update);
router.patch("/:id", vehicleResponsiblesController.patch);
router.delete("/:id", vehicleResponsiblesController.delete);

// Custom endpoints for specific functionality
router.get(
  "/vehicle/:vehicleId/current",
  validateUUIDParam("vehicleId"),
  vehicleResponsiblesController.getCurrentForVehicle,
);
router.get(
  "/user/:userId/current",
  validateUUIDParam("userId"),
  vehicleResponsiblesController.getCurrentVehiclesForUser,
);

export default router;
