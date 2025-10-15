import express from "express";
import { validateUUIDParam } from "../middleware/validation";
import { createVehicleKilometersController } from "../controllers/vehicleKilometersController";
import { requireVehiclePermissionFromParam } from "../middleware/permission";
import { PermissionType } from "../utils/common";

// This router is mounted at /vehicles/:id/kilometers (see index.ts)
// We merge params so we can access :id inside the handlers
const router = express.Router({ mergeParams: true });
const controller = createVehicleKilometersController();

// Validate the parent vehicle id param
router.use(validateUUIDParam("id"));

// GET /vehicles/:id/kilometers - list logs for vehicle
router.get(
  "/",
  requireVehiclePermissionFromParam(PermissionType.READ, "id"),
  controller.getByVehicle,
);

// POST /vehicles/:id/kilometers - create log for vehicle
router.post(
  "/",
  requireVehiclePermissionFromParam(PermissionType.MAINTAINER, "id"),
  controller.create,
);

export default router;
