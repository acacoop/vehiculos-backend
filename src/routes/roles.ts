import { Router } from "express";
import { createRolesController } from "../controllers/rolesController";
import { validateSchema } from "../middleware/errorHandler";
import { RoleInputSchema } from "../schemas/role";
import { validateUUIDParam } from "../middleware/validation";

const router = Router();
const controller = createRolesController();

router.get("/", controller.getAll);
router.get("/:id", validateUUIDParam("id"), controller.getById);
router.post("/", validateSchema(RoleInputSchema), controller.create);
router.put(
  "/:id",
  validateUUIDParam("id"),
  validateSchema(RoleInputSchema.partial()),
  controller.update
);
router.patch(
  "/:id",
  validateUUIDParam("id"),
  validateSchema(RoleInputSchema.partial()),
  controller.patch
);
router.delete("/:id", validateUUIDParam("id"), controller.delete);

export default router;
