import express from 'express';
import { validateUUIDParam } from '../../middleware/validation';
import { vehicleKilometersController } from '../../controllers/vehicleKilometersController';

const router = express.Router();

// GET /vehicles/kilometers/:vehicleId
router.get('/:vehicleId', validateUUIDParam('vehicleId'), vehicleKilometersController.getByVehicle);

// POST /vehicles/kilometers
router.post('/', vehicleKilometersController.create);

export default router;
