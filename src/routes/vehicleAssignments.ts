import express from "express";
import { createAssignmentsController } from "@/controllers/assignmentsController";
import { validateUUIDParam } from "@/middleware/validation";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = express.Router();
const controller = createAssignmentsController();

// TODO: Implement proper vehicle permission checking for assignments
router.get("/", requireRole(UserRoleEnum.USER), controller.getAll);

router.get(
  "/:id",
  validateUUIDParam("id"),
  // TODO: Implement proper vehicle permission checking for assignments
  // Currently using admin-only access until vehicle permission logic is implemented
  requireRole(UserRoleEnum.ADMIN),
  controller.getById,
);

router.post("/", requireRole(UserRoleEnum.ADMIN), controller.create);

router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.update,
);

router.patch(
  "/:id/finish",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.finishAssignment,
);

export default router;
