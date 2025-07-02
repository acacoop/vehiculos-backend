import { Router, Request, Response, NextFunction } from "express";
import { vehiclesController } from "../controllers/vehiclesController";
import { validateSchema, AppError } from "../middleware/errorHandler";
import { validateId } from "../middleware/validation";
import { VehicleSchema } from "../schemas/vehicle";
import { licensePlateRegex } from "../schemas/validations";

const router = Router();

// Middleware to validate license plate
const validateLicensePlate = (req: Request, res: Response, next: NextFunction) => {
  const { licensePlate } = req.params;
  if (!licensePlateRegex.test(licensePlate)) {
    throw new AppError(
      'The provided license plate format is invalid. Expected format: ABC123 or AB123CD',
      400,
      'https://example.com/problems/invalid-license-plate',
      'Invalid License Plate Format'
    );
  }
  next();
};

// GET /vehicles - Get all vehicles with pagination
router.get("/", vehiclesController.getAll);

// GET /vehicles/:id - Get vehicle by ID
router.get("/:id", validateId, vehiclesController.getById);

// GET /vehicles/license-plate/:licensePlate - Get vehicle by license plate
router.get("/license-plate/:licensePlate", validateLicensePlate, vehiclesController.getVehicleByLicensePlate);

// POST /vehicles - Create new vehicle
router.post("/", validateSchema(VehicleSchema), vehiclesController.create);

// PUT /vehicles/:id - Update vehicle (replace)
router.put("/:id", validateId, validateSchema(VehicleSchema.partial()), vehiclesController.update);

// PATCH /vehicles/:id - Partial update vehicle
router.patch("/:id", validateId, validateSchema(VehicleSchema.partial()), vehiclesController.patch);

// DELETE /vehicles/:id - Delete vehicle
router.delete("/:id", validateId, vehiclesController.delete);

export default router;
