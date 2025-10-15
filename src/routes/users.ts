import { Router } from "express";
import { UsersController } from "../controllers/usersController";
import { validateSchema } from "../middleware/errorHandler";
import { validateUUIDParam } from "../middleware/validation";
import { UserSchema } from "../schemas/user";
import { AppDataSource } from "../db";
import { ServiceFactory } from "../factories/serviceFactory";
import { requireRole } from "../middleware/permission";
import { UserRoleEnum } from "../utils/common";

const router = Router();

// Create service factory and controller with proper dependency injection
const serviceFactory = new ServiceFactory(AppDataSource);
const usersService = serviceFactory.createUsersService();
const usersController = new UsersController(usersService);

// GET /users - Get all users with pagination and search
// Supports query parameters: page, limit, email, cuit, firstName, lastName
// Examples:
// - /users?email=user@example.com
// - /users?cuit=12345678
// - /users?firstName=John&lastName=Doe
router.get("/", usersController.getAll);

// GET /users/:id - Get user by ID
router.get("/:id", validateUUIDParam("id"), usersController.getById);

// POST /users - Create new user
router.post(
  "/",
  requireRole(UserRoleEnum.ADMIN),
  validateSchema(UserSchema),
  usersController.create,
);

// PUT /users/:id - Update user (replace)
router.put(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateSchema(UserSchema.partial()),
  usersController.update,
);

// PATCH /users/:id - Partial update user
router.patch(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  validateSchema(UserSchema.partial()),
  usersController.patch,
);

// DELETE /users/:id - Delete user
router.delete(
  "/:id",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  usersController.delete,
);

// POST /users/:id/activate - Activate user
router.post(
  "/:id/activate",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  usersController.activate,
);

// POST /users/:id/deactivate - Deactivate user
router.post(
  "/:id/deactivate",
  requireRole(UserRoleEnum.ADMIN),
  validateUUIDParam("id"),
  usersController.deactivate,
);

export default router;
