import express from "express";
import { createAssignmentsController } from "../controllers/assignmentsController";
import { validateUUIDParam } from "../middleware/validation";
import {
  requireRole,
  requireVehiclePermissionWith,
} from "../middleware/permission";
import { UserRoleEnum } from "../utils/common";
import { PermissionType } from "../utils/common";
import { addPermissionFilter } from "../middleware/permissionFilter";
import { vehicleIdFromAssignment } from "../middleware/vehicleIdMappers";

const router = express.Router();
const controller = createAssignmentsController();

// GET: Fetch all assignments with pagination and filters
router.get("/", addPermissionFilter(PermissionType.READ), controller.getAll);

// GET: Fetch assignment by ID
// Users with READ permission can view assignments for vehicles they have access to
router.get(
  "/:id",
  validateUUIDParam("id"),
  requireVehiclePermissionWith(PermissionType.READ, vehicleIdFromAssignment),
  controller.getById,
);

// POST: Create a new assignment
router.post("/", requireRole(UserRoleEnum.ADMIN), controller.create);

// PATCH: Update an assignment
router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.patch,
);

// PATCH: Finish/end an assignment
router.patch(
  "/:id/finish",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.finishAssignment,
);
// Legacy routes removed

export default router;
