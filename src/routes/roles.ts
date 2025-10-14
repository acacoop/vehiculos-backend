import { Router } from "express";
import { RolesController } from "../controllers/rolesController";
import { validateSchema } from "../middleware/errorHandler";
import { RoleInputSchema } from "../schemas/role";
import { validateUUIDParam } from "../middleware/validation";
import { AppDataSource } from "../db";
import { ServiceFactory } from "../factories/serviceFactory";

const router = Router();

// Create service factory and controller with proper dependency injection
const serviceFactory = new ServiceFactory(AppDataSource);
const rolesService = serviceFactory.createRolesService();
const controller = new RolesController(rolesService);

router.get("/", controller.getAll);
router.get("/:id", validateUUIDParam("id"), controller.getById);
router.post("/", validateSchema(RoleInputSchema), controller.create);
router.put(
  "/:id",
  validateUUIDParam("id"),
  validateSchema(RoleInputSchema.partial()),
  controller.update,
);
router.patch(
  "/:id",
  validateUUIDParam("id"),
  validateSchema(RoleInputSchema.partial()),
  controller.patch,
);
router.delete("/:id", validateUUIDParam("id"), controller.delete);

export default router;
