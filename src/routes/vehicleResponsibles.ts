import express from "express";
import { vehicleResponsiblesController } from "../controllers/vehicleResponsiblesController";

const router = express.Router();

// Standard CRUD endpoints using BaseController
router.get("/", vehicleResponsiblesController.getAll);
router.get("/:id", vehicleResponsiblesController.getById);
router.post("/", vehicleResponsiblesController.create);
router.put("/:id", vehicleResponsiblesController.update);
router.patch("/:id", vehicleResponsiblesController.patch);
router.delete("/:id", vehicleResponsiblesController.delete);

// Custom endpoints for specific functionality
router.get("/vehicle/:vehicleId/current", vehicleResponsiblesController.getCurrentForVehicle);
router.get("/user/:userId/current", vehicleResponsiblesController.getCurrentVehiclesForUser);

export default router;
