import express from "express";
import { validateUUIDParam, validateBody } from "@/middleware/validation";
import { createReservationsController } from "@/controllers/reservationsController";
import { ReservationSchema } from "@/schemas/reservation";
import {
  requireRole,
  requireVehiclePermissionFromParam,
  requireVehiclePermissionFromBody,
  requireEntityVehiclePermission,
} from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";
import { PermissionType } from "@/enums/PermissionType";
import { ServiceFactory } from "@/factories/serviceFactory";
import { AppDataSource } from "@/db";

const router = express.Router();
const controller = createReservationsController();

router.get("/", requireRole(UserRoleEnum.ADMIN), controller.getAll);

router.get(
  "/:id",
  validateUUIDParam("id"),
  requireEntityVehiclePermission(
    new ServiceFactory(AppDataSource).createReservationsService(),
    PermissionType.READ,
  ),
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
