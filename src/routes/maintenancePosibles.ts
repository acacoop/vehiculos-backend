import express from "express";
import { createMaintenancePosiblesController } from "../controllers/maintenancePosiblesController";
import {
  validateUUIDParam,
  validateBody,
} from "../middleware/validation";
import {
  MaintenanceCreateSchema,
  MaintenanceUpdateSchema,
} from "../schemas/maintenance";

const router = express.Router();
const controller = createMaintenancePosiblesController();

// GET: Fetch all possible maintenances
router.get("/", controller.getAll);

// GET: Fetch maintenance by ID
router.get("/:id", validateUUIDParam("id"), controller.getById);

// POST: Create a new maintenance (requires all required fields)
router.post("/", validateBody(MaintenanceCreateSchema), controller.create);

// PUT: Update a maintenance (full replacement)
router.put(
  "/:id",
  validateUUIDParam("id"),
  validateBody(MaintenanceCreateSchema),
  controller.update,
);

// PATCH: Update a maintenance (partial update)
router.patch(
  "/:id",
  validateUUIDParam("id"),
  validateBody(MaintenanceUpdateSchema),
  controller.patch,
);

// DELETE: Delete a maintenance
router.delete("/:id", validateUUIDParam("id"), controller.delete);

// GET: Get all vehicles assigned to a specific maintenance
router.get(
  "/:id/vehicles",
  validateUUIDParam("id"),
  controller.getVehiclesByMaintenance,
);

export default router;
