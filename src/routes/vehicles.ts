import { Router, Request, Response, NextFunction } from "express";
import { vehiclesController } from "../controllers/vehiclesController";
import { validateSchema, AppError } from "../middleware/errorHandler";
import { validateId } from "../middleware/validation";
import { VehicleSchema } from "../schemas/vehicle";
import { licensePlateRegex } from "../schemas/validations";

const router = Router();

// Middleware to validate license plate in query parameters
const validateLicensePlateQuery = (req: Request, res: Response, next: NextFunction) => {
  const licensePlate = req.query.licensePlate as string;
  if (licensePlate && !licensePlateRegex.test(licensePlate)) {
    throw new AppError(
      'The provided license plate format is invalid. Expected format: ABC123 or AB123CD',
      400,
      'https://example.com/problems/invalid-license-plate',
      'Invalid License Plate Format'
    );
  }
  next();
};

// GET /vehicles - Get all vehicles with pagination and search
// Supports query parameters: page, limit, license-plate, brand, model, year
// Examples: 
// - /vehicles?license-plate=AAA-123 
// - /vehicles?brand=Toyota&model=Corolla
// - /vehicles?year=2020&page=1&limit=5
router.get("/", validateLicensePlateQuery, vehiclesController.getAll);

// GET /vehicles/:id - Get vehicle by ID
router.get("/:id", validateId, vehiclesController.getById);

// POST /vehicles - Create new vehicle
router.post("/", validateSchema(VehicleSchema), vehiclesController.create);

// PUT /vehicles/:id - Update vehicle (replace)
router.put("/:id", validateId, validateSchema(VehicleSchema.partial()), vehiclesController.update);

// PATCH /vehicles/:id - Partial update vehicle
router.patch("/:id", validateId, validateSchema(VehicleSchema.partial()), vehiclesController.patch);

// DELETE /vehicles/:id - Delete vehicle
router.delete("/:id", validateId, vehiclesController.delete);

export default router;
