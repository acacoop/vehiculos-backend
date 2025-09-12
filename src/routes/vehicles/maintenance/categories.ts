import express from "express";
import { createMaintenanceCategoriesController } from "../../../controllers/maintenanceCategoriesController";
import {
  validateUUIDParam,
  validateBody,
} from "../../../middleware/validation";
import { MaintenanceCategorySchema } from "../../../schemas/maintenance/category";

const router = express.Router();
const controller = createMaintenanceCategoriesController();

// GET: Fetch all maintenance categories
router.get("/", controller.getAll);

// GET: Fetch maintenance category by ID
router.get("/:id", validateUUIDParam("id"), controller.getById);

// POST: Create a new maintenance category
router.post(
  "/",
  validateBody(MaintenanceCategorySchema.omit({ id: true })),
  controller.create,
);

// PUT: Update a maintenance category (full replacement)
router.put(
  "/:id",
  validateUUIDParam("id"),
  validateBody(MaintenanceCategorySchema.omit({ id: true })),
  controller.update,
);

// PATCH: Update a maintenance category (partial update)
router.patch("/:id", validateUUIDParam("id"), controller.patch);

// DELETE: Delete a maintenance category
router.delete("/:id", validateUUIDParam("id"), controller.delete);

export default router;
