import express from "express";
import { createMaintenancePosiblesController } from "../../../controllers/maintenancePosiblesController";
import {
  validateId,
  validateMaintenanceData,
} from "../../../middleware/validation";

const router = express.Router();
const controller = createMaintenancePosiblesController();

// GET: Fetch all possible maintenances
router.get("/", controller.getAll);

// GET: Fetch maintenance by ID
router.get("/:id", validateId, controller.getById);

// POST: Create a new maintenance
router.post("/", validateMaintenanceData, controller.create);

// PUT: Update a maintenance (full replacement)
router.put("/:id", validateId, validateMaintenanceData, controller.update);

// PATCH: Update a maintenance (partial update)
router.patch("/:id", validateId, controller.patch);

// DELETE: Delete a maintenance
router.delete("/:id", validateId, controller.delete);

// GET: Get all vehicles assigned to a specific maintenance
router.get("/:id/vehicles", validateId, controller.getVehiclesByMaintenance);

export default router;
