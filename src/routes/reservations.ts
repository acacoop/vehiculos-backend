import express from "express";
import { validateUUIDParam, validateBody } from "../middleware/validation";
import { createReservationsController } from "../controllers/reservationsController";
import { ReservationSchema } from "../schemas/reservation";
import {
  requireRole,
  requireVehiclePermissionFromParam,
  requireVehiclePermissionFromBody,
} from "../middleware/permission";
import { UserRoleEnum } from "../utils/common";
import { PermissionType } from "../utils/common";
import { addPermissionFilter } from "../middleware/permissionFilter";

const router = express.Router();
const controller = createReservationsController();

// GET: Fetch all reservations with pagination and search
router.get("/", addPermissionFilter(PermissionType.READ), controller.getAll);

// GET: Fetch reservations for a specific user
router.get(
  "/user/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.getByUser,
);

// GET: Fetch reservations for a specific vehicle
router.get(
  "/vehicle/:id",
  validateUUIDParam("id"),
  requireVehiclePermissionFromParam(PermissionType.READ, "id"),
  controller.getByVehicle,
);

// GET: Fetch reservations for all vehicles assigned to a specific user
router.get(
  "/user/:id/assigned",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.getAssignedVehicles,
);

// GET: Fetch reservations for a specific user that are scheduled for today
router.get(
  "/user/:id/today",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.getTodayByUser,
);

// POST: Create a new reservation - requires DRIVER permission or admin
// User must have DRIVER permission on the vehicle being reserved
router.post(
  "/",
  requireVehiclePermissionFromBody(PermissionType.DRIVER, "vehicleId"),
  validateBody(ReservationSchema),
  controller.create,
);

export default router;
