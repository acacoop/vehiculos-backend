import express from "express";
import { createVehiclesController } from "../../controllers/vehiclesController";
import { validateId } from "../../middleware/validation";
import { VehicleSchema } from "../../schemas/vehicle";
import { requireRole } from "../../middleware/auth";

const router = express.Router();
const controller = createVehiclesController();

// Inline validator middleware (since previous validateVehicleData import referenced a removed file)
const validateVehicleData = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    VehicleSchema.parse(req.body);
    next();
  } catch (err) {
    res
      .status(400)
      .json({ error: "Invalid vehicle data", details: (err as Error).message });
  }
};

// GET: Fetch all vehicles
router.get("/", controller.getAll);

// GET: Fetch a vehicle by id
router.get("/:id", validateId, controller.getById);

// POST: Add a new vehicle
router.post("/", requireRole("admin"), validateVehicleData, controller.create);

export default router;
