import { Router } from "express";
import { UsersController } from "@/controllers/usersController";
import { validateSchema } from "@/middleware/errorHandler";
import { validateUUIDParam } from "@/middleware/validation";
import { UserSchema } from "@/schemas/user";
import { AppDataSource } from "@/db";
import { ServiceFactory } from "@/factories/serviceFactory";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = Router();

const serviceFactory = new ServiceFactory(AppDataSource);
const usersService = serviceFactory.createUsersService();
const usersController = new UsersController(usersService);

router.get("/", usersController.getAll);

router.get("/:id", validateUUIDParam("id"), usersController.getById);

router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  validateSchema(UserSchema),
  usersController.create,
);

router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateSchema(UserSchema.partial()),
  usersController.update,
);

router.delete(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  usersController.delete,
);

router.post(
  "/:id/activate",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  usersController.activate,
);

router.post(
  "/:id/deactivate",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  usersController.deactivate,
);

export default router;
