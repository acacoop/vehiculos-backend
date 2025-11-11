import express from "express";
import { validateUUIDParam, validateBody } from "@/middleware/validation";
import { createReservationsController } from "@/controllers/reservationsController";
import { ReservationSchema } from "@/schemas/reservation";
import {
  requireRole,
  requireVehiclePermissionFromParam,
  requireVehiclePermissionFromBody,
} from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";
import { PermissionType } from "@/enums/PermissionType";

const router = express.Router();
const controller = createReservationsController();

router.get("/", requireRole(UserRoleEnum.ADMIN), controller.getAll);

router.get(
  "/:id",
  validateUUIDParam("id"),
  // TODO: Implement proper vehicle permission checking for reservations
  // Currently using admin-only access until vehicle permission logic is implemented
  requireRole(UserRoleEnum.ADMIN),
  controller.getById,
);

router.get(
  "/user/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.getByUser,
);

router.get(
  "/vehicle/:id",
  validateUUIDParam("id"),
  requireVehiclePermissionFromParam(PermissionType.READ, "id"),
  controller.getByVehicle,
);

router.get(
  "/user/:id/assigned",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.getAssignedVehicles,
);

router.get(
  "/user/:id/today",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.getTodayByUser,
);

router.post(
  "/",
  requireVehiclePermissionFromBody(PermissionType.DRIVER, "vehicleId"),
  validateBody(ReservationSchema),
  controller.create,
);

export default router;
