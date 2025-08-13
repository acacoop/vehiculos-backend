import express from "express";
import { maintenancePosiblesController } from "../../../controllers/maintenancePosiblesController";
import {
  validateId,
  validateMaintenanceData,
} from "../../../middleware/validation";

const router = express.Router();

// GET: Fetch all possible maintenances
router.get("/", maintenancePosiblesController.getAll);

// GET: Fetch maintenance by ID
router.get("/:id", validateId, maintenancePosiblesController.getById);

// POST: Create a new maintenance
router.post("/", validateMaintenanceData, maintenancePosiblesController.create);

// PUT: Update a maintenance (full replacement)
router.put(
  "/:id",
  validateId,
  validateMaintenanceData,
  maintenancePosiblesController.update
);

// PATCH: Update a maintenance (partial update)
router.patch("/:id", validateId, maintenancePosiblesController.patch);

// DELETE: Delete a maintenance
router.delete("/:id", validateId, maintenancePosiblesController.delete);

export default router;
