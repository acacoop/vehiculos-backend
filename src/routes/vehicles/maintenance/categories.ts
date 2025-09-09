import express from "express";
import { createMaintenanceCategoriesController } from "../../../controllers/maintenanceCategoriesController";
import {
  validateId,
  validateMaintenanceCategoryData,
} from "../../../middleware/validation";

const router = express.Router();
const controller = createMaintenanceCategoriesController();

// GET: Fetch all maintenance categories
router.get("/", controller.getAll);

// GET: Fetch maintenance category by ID
router.get("/:id", validateId, controller.getById);

// POST: Create a new maintenance category
router.post("/", validateMaintenanceCategoryData, controller.create);

// PUT: Update a maintenance category (full replacement)
router.put(
  "/:id",
  validateId,
  validateMaintenanceCategoryData,
  controller.update,
);

// PATCH: Update a maintenance category (partial update)
router.patch("/:id", validateId, controller.patch);

// DELETE: Delete a maintenance category
router.delete("/:id", validateId, controller.delete);

export default router;
