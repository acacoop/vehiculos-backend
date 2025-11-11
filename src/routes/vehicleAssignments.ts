import express from "express";
import { createAssignmentsController } from "@/controllers/assignmentsController";
import { validateUUIDParam } from "@/middleware/validation";
import {
  requireRole,
  requireEntityVehiclePermission,
} from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";
import { PermissionType } from "@/enums/PermissionType";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";

const router = express.Router();
const controller = createAssignmentsController();

router.get("/", requireRole(UserRoleEnum.ADMIN), controller.getAll);

router.get(
  "/:id",
  validateUUIDParam("id"),
  requireEntityVehiclePermission(
    new ServiceFactory(AppDataSource).createAssignmentsService(),
    PermissionType.READ,
    "getWithDetailsById",
  ),
  controller.getById,
);

router.post("/", requireRole(UserRoleEnum.ADMIN), controller.create);

router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.update,
);

router.patch(
  "/:id/finish",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.finishAssignment,
);

export default router;
