import express from "express";
import { createAssignmentsController } from "../../controllers/assignmentsController";
import { validateId } from "../../middleware/validation";

const router = express.Router();
const controller = createAssignmentsController();

// GET: Fetch all assignments with pagination and filters
router.get("/", controller.getAll);

// GET: Fetch assignment by ID
router.get("/:id", controller.getById);

// POST: Create a new assignment
router.post("/", controller.create);

// PATCH: Update an assignment
router.patch("/:id", validateId, controller.patch);

// PATCH: Finish/end an assignment
router.patch("/:id/finish", validateId, controller.finishAssignment);
// Legacy routes removed

export default router;
