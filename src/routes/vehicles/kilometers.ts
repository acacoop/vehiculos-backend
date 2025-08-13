import express from 'express';
import { validateUUIDParam } from '../../middleware/validation';
import { vehicleKilometersController } from '../../controllers/vehicleKilometersController';

// This router is mounted at /vehicles/:id/kilometers (see index.ts)
// We merge params so we can access :id inside the handlers
const router = express.Router({ mergeParams: true });

// Validate the parent vehicle id param
router.use(validateUUIDParam('id'));

// GET /vehicles/:id/kilometers - list logs for vehicle
router.get('/', vehicleKilometersController.getByVehicle);

// POST /vehicles/:id/kilometers - create log for vehicle
router.post('/', vehicleKilometersController.create);

export default router;
