import express from "express";
import { MaintenanceCategoriesController } from "@/controllers/maintenanceCategoriesController";
import { validateUUIDParam, validateBody } from "@/middleware/validation";
import { MaintenanceCategorySchema } from "@/schemas/maintenanceCategory";
import { AppDataSource } from "@/db";
import { ServiceFactory } from "@/factories/serviceFactory";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/utils";

const router = express.Router();
const serviceFactory = new ServiceFactory(AppDataSource);
const service = serviceFactory.createMaintenanceCategoriesService();
const controller = new MaintenanceCategoriesController(service);

router.get("/", controller.getAll);

router.get("/:id", validateUUIDParam("id"), controller.getById);

router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  validateBody(MaintenanceCategorySchema.omit({ id: true })),
  controller.create,
);

router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateBody(MaintenanceCategorySchema.omit({ id: true }).partial()),
  controller.update,
);

router.delete(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.delete,
);

export default router;
