import express from "express";
import { validateUUIDParam } from "@/middleware/validation";
import { createVehicleKilometersController } from "@/controllers/vehicleKilometersController";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = express.Router();
const controller = createVehicleKilometersController();

// GET /vehicle-kilometersLogs - Get all kilometers logs
// Users can list logs (filtered by their assigned vehicles in the service layer)
router.get("/", requireRole(UserRoleEnum.USER), controller.getAll);

// GET /vehicle-kilometersLogs/:id - Get specific kilometers log
router.get(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.USER),
  controller.getById,
);

// POST /vehicle-kilometersLogs - Create new kilometers log
// Users can create logs for their assigned vehicles
router.post("/", requireRole(UserRoleEnum.USER), controller.create);

// PATCH /vehicle-kilometersLogs/:id - Update kilometers log
router.patch(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.ADMIN),
  controller.update,
);

// DELETE /vehicle-kilometersLogs/:id - Delete kilometers log
router.delete(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.ADMIN),
  controller.delete,
);

export default router;
