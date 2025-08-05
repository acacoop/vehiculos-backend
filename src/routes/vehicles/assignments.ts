import express from "express";
import { assignmentsController } from "../../controllers/assignmentsController";
import {
  getUsersAssignedByVehicleId,
  getVehiclesAssignedByUserId,
} from "../../services/vehicles/assignments";
import { validateId } from "../../middleware/validation";

const router = express.Router();

// GET: Fetch all assignments with pagination and filters
router.get("/", assignmentsController.getAll);

// GET: Fetch assignment by ID
router.get("/:id", assignmentsController.getById);

// POST: Create a new assignment
router.post("/", assignmentsController.create);

// PATCH: Update an assignment
router.patch("/:id", validateId, assignmentsController.patch);

// PATCH: Finish/end an assignment
router.patch("/:id/finish", validateId, assignmentsController.finishAssignment);

// Legacy routes for backward compatibility
router.get("/user/:id", validateId, async (req, res) => {
  const id = req.params.id;
  
  try {
    const vehicles = await getVehiclesAssignedByUserId(id);
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

router.get("/vehicle/:id", validateId, async (req, res) => {
  const id = req.params.id;
  
  try {
    const users = await getUsersAssignedByVehicleId(id);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

export default router;
