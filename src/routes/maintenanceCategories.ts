import express from "express";
import { MaintenanceCategoriesController } from "../controllers/maintenanceCategoriesController";
import { validateUUIDParam, validateBody } from "../middleware/validation";
import { MaintenanceCategorySchema } from "../schemas/maintenanceCategory";
import { AppDataSource } from "../db";
import { ServiceFactory } from "../factories/serviceFactory";
import { requireRole } from "../middleware/permission";
import { UserRoleEnum } from "../utils/common";

const router = express.Router();
const serviceFactory = new ServiceFactory(AppDataSource);
const service = serviceFactory.createMaintenanceCategoriesService();
const controller = new MaintenanceCategoriesController(service);

// GET: Fetch all maintenance categories
router.get("/", controller.getAll);

// GET: Fetch maintenance category by ID
router.get("/:id", validateUUIDParam("id"), controller.getById);

// POST: Create a new maintenance category
router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  validateBody(MaintenanceCategorySchema.omit({ id: true })),
  controller.create,
);

// PUT: Update a maintenance category (full replacement)
router.put(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateBody(MaintenanceCategorySchema.omit({ id: true })),
  controller.update,
);

// PATCH: Update a maintenance category (partial update)
router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.patch,
);

// DELETE: Delete a maintenance category
router.delete(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.delete,
);

export default router;
