import { Router } from "express";
import { UserRolesController } from "@/controllers/userRolesController";
import { validateBody, validateUUIDParam } from "@/middleware/validation";
import {
  UserRoleInputSchema,
  UserRoleUpdateSchema,
  UserRoleEndSchema,
} from "@/schemas/userRole";
import { requireRole, requireSelfOrAdmin } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";
import { AppDataSource } from "@/db";
import { ServiceFactory } from "@/factories/serviceFactory";

const router = Router();

const serviceFactory = new ServiceFactory(AppDataSource);
const userRolesService = serviceFactory.createUserRolesService();
const controller = new UserRolesController(userRolesService);

router.get("/", requireRole(UserRoleEnum.ADMIN), controller.getAll);

router.get(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.getById,
);

router.get(
  "/user/:userId",
  validateUUIDParam("userId"),
  requireSelfOrAdmin("userId"),
  controller.getByUser,
);

router.get(
  "/user/:userId/active",
  validateUUIDParam("userId"),
  requireSelfOrAdmin("userId"),
  controller.getActiveByUser,
);

router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  validateBody(UserRoleInputSchema),
  controller.create,
);

router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateBody(UserRoleUpdateSchema.partial()),
  controller.update,
);

router.post(
  "/:id/end",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateBody(UserRoleEndSchema),
  controller.endRole,
);

router.delete(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.delete,
);

export default router;
