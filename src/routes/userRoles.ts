import { Router } from "express";
import { UserRolesController } from "../controllers/userRolesController";
import { validateBody, validateUUIDParam } from "../middleware/validation";
import {
  UserRoleInputSchema,
  UserRoleUpdateSchema,
  UserRoleEndSchema,
} from "../schemas/userRole";
import { requireRole, requireSelfOrAdmin } from "../middleware/permission";
import { UserRoleEnum } from "../utils/common";
import { AppDataSource } from "../db";
import { ServiceFactory } from "../factories/serviceFactory";

const router = Router();

// Create service factory and controller
const serviceFactory = new ServiceFactory(AppDataSource);
const userRolesService = serviceFactory.createUserRolesService();
const controller = new UserRolesController(userRolesService);

// GET /user-roles - Get all user roles with pagination and filtering
// Supports query parameters: page, limit, userId, role, activeOnly
// Admin only - viewing all role assignments
router.get("/", requireRole(UserRoleEnum.ADMIN), controller.getAll);

// GET /user-roles/:id - Get user role by ID
// Admin only - viewing specific role assignment
router.get(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.getById,
);

// GET /user-roles/user/:userId - Get all roles for a specific user
// Users can view their own roles, admins can view any user's roles
router.get(
  "/user/:userId",
  validateUUIDParam("userId"),
  requireSelfOrAdmin("userId"),
  controller.getByUser,
);

// GET /user-roles/user/:userId/active - Get active role for a specific user
// Users can view their own active role, admins can view any user's active role
router.get(
  "/user/:userId/active",
  validateUUIDParam("userId"),
  requireSelfOrAdmin("userId"),
  controller.getActiveByUser,
);

// POST /user-roles - Create new user role assignment
// Admin only - assigning roles to users
router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  validateBody(UserRoleInputSchema),
  controller.create,
);

// PUT /user-roles/:id - Update user role (full replacement)
// Admin only - modifying role assignments
router.put(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateBody(UserRoleUpdateSchema),
  controller.update,
);

// PATCH /user-roles/:id - Partial update user role
// Admin only - modifying role assignments
router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateBody(UserRoleUpdateSchema.partial()),
  controller.patch,
);

// POST /user-roles/:id/end - End a user role (set endTime)
// Admin only - ending role assignments
router.post(
  "/:id/end",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateBody(UserRoleEndSchema),
  controller.endRole,
);

// DELETE /user-roles/:id - Delete user role
// Admin only - removing role assignments
router.delete(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  controller.delete,
);

export default router;
