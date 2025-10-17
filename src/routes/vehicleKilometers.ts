import express from "express";
import { validateUUIDParam } from "../middleware/validation";
import { createVehicleKilometersController } from "../controllers/vehicleKilometersController";
import { requireVehiclePermissionFromParam } from "../middleware/permission";
import { PermissionType } from "../utils";

const router = express.Router({ mergeParams: true });
const controller = createVehicleKilometersController();

router.use(validateUUIDParam("id"));

router.get(
  "/",
  requireVehiclePermissionFromParam(PermissionType.READ, "id"),
  controller.getByVehicle,
);

router.post(
  "/",
  requireVehiclePermissionFromParam(PermissionType.MAINTAINER, "id"),
  controller.create,
);

export default router;
