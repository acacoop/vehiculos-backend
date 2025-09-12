import express from "express";
import { createVehiclesController } from "../../controllers/vehiclesController";
import { validateUUIDParam, validateBody } from "../../middleware/validation";
import { VehicleSchema } from "../../schemas/vehicle";
import { requireRole } from "../../middleware/auth";

const router = express.Router();
const controller = createVehiclesController();

// GET: Fetch all vehicles
router.get("/", controller.getAll);

// GET: Fetch a vehicle by id
router.get("/:id", validateUUIDParam("id"), controller.getById);

// POST: Add a new vehicle
router.post(
  "/",
  requireRole("admin"),
  validateBody(VehicleSchema),
  controller.create,
);

export default router;
