import { Router } from "express";
import { usersController } from "../controllers/usersController";
import { validateSchema } from "../middleware/errorHandler";
import { validateId } from "../middleware/validation";
import { UserSchema } from "../schemas/user";

const router = Router();

// GET /users - Get all users with pagination and search
// Supports query parameters: page, limit, email, dni, firstName, lastName
// Examples: 
// - /users?email=user@example.com 
// - /users?dni=12345678
// - /users?firstName=John&lastName=Doe
router.get("/", usersController.getAll);

// GET /users/:id - Get user by ID
router.get("/:id", validateId, usersController.getById);

// POST /users - Create new user
router.post("/", validateSchema(UserSchema), usersController.create);

// PUT /users/:id - Update user (replace)
router.put("/:id", validateId, validateSchema(UserSchema.partial()), usersController.update);

// PATCH /users/:id - Partial update user
router.patch("/:id", validateId, validateSchema(UserSchema.partial()), usersController.patch);

// DELETE /users/:id - Delete user
router.delete("/:id", validateId, usersController.delete);

// POST /users/:id/activate - Activate user
router.post("/:id/activate", usersController.activate);

// POST /users/:id/deactivate - Deactivate user
router.post("/:id/deactivate", usersController.deactivate);

export default router;
