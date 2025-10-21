import express from "express";
import { createAssignmentsController } from "@/controllers/assignmentsController";
import { validateUUIDParam } from "@/middleware/validation";
import {
  requireRole,
  requireVehiclePermissionWith,
} from "@/middleware/permission";
import { UserRoleEnum } from "@/utils";
import { PermissionType } from "@/utils";
import { vehicleIdFromAssignment } from "@/middleware/vehicleIdMappers";

const router = express.Router();
const controller = createAssignmentsController();

router.get("/", requireRole(UserRoleEnum.ADMIN), controller.getAll);

router.get(
  "/:id",
  validateUUIDParam("id"),
  requireVehiclePermissionWith(PermissionType.READ, vehicleIdFromAssignment),
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
