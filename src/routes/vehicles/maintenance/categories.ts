import express from "express";
import { maintenanceCategoriesController } from "../../../controllers/maintenanceCategoriesController";
import { validateId, validateMaintenanceCategoryData } from "../../../middleware/validation";

const router = express.Router();

// GET: Fetch all maintenance categories
router.get("/", maintenanceCategoriesController.getAll);

// GET: Fetch maintenance category by ID
router.get("/:id", validateId, maintenanceCategoriesController.getById);

// POST: Create a new maintenance category
router.post("/", validateMaintenanceCategoryData, maintenanceCategoriesController.create);

// PUT: Update a maintenance category (full replacement)
router.put("/:id", validateId, validateMaintenanceCategoryData, maintenanceCategoriesController.update);

// PATCH: Update a maintenance category (partial update)
router.patch("/:id", validateId, maintenanceCategoriesController.patch);

// DELETE: Delete a maintenance category
router.delete("/:id", validateId, maintenanceCategoriesController.delete);

export default router;
