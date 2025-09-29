import { Router, Request, Response, NextFunction } from "express";
import { createVehiclesController } from "../controllers/vehiclesController";
import vehicleKilometersRoutes from "./vehicles/kilometers";
import { validateSchema, AppError } from "../middleware/errorHandler";
import { validateUUIDParam } from "../middleware/validation";
import { VehicleInputSchema, VehicleUpdateSchema } from "../schemas/vehicle";
import { licensePlateRegex } from "../schemas/validations";

const router = Router();
// Each router instance gets its own controller (and underlying service/repository instances)
const vehiclesController = createVehiclesController();

// Middleware to validate license plate in query parameters
const validateLicensePlateQuery = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const licensePlate = req.query.licensePlate as string;
  if (licensePlate && !licensePlateRegex.test(licensePlate)) {
    throw new AppError(
      "The provided license plate format is invalid. Expected format: ABC123 or AB123CD",
      400,
      "https://example.com/problems/invalid-license-plate",
      "Invalid License Plate Format",
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
router.get("/:id", validateUUIDParam("id"), vehiclesController.getById);

// POST /vehicles - Create new vehicle (validate input schema)
router.post("/", validateSchema(VehicleInputSchema), vehiclesController.create);

// PUT /vehicles/:id - Update vehicle (replace)
router.put(
  "/:id",
  validateUUIDParam("id"),
  validateSchema(VehicleUpdateSchema),
  vehiclesController.update,
);

// PATCH /vehicles/:id - Partial update vehicle
router.patch(
  "/:id",
  validateUUIDParam("id"),
  validateSchema(VehicleUpdateSchema),
  vehiclesController.patch,
);

// DELETE /vehicles/:id - Delete vehicle
router.delete("/:id", validateUUIDParam("id"), vehiclesController.delete);

// Nested kilometers routes for a vehicle
router.use("/:id/kilometers", vehicleKilometersRoutes);

export default router;
