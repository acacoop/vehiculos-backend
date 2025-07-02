import { Router } from "express";
import { usersController } from "../controllers/usersController";
import { validateSchema, validateId } from "../middleware/errorHandler";
import { UserSchema } from "../schemas/user";

const router = Router();

// GET /users - Get all users with pagination
router.get("/", usersController.getAll);

// GET /users/:id - Get user by ID
router.get("/:id", validateId, usersController.getById);

// GET /users/email/:email - Get user by email
router.get("/email/:email", usersController.getUserByEmail);

// GET /users/dni/:dni - Get user by DNI
router.get("/dni/:dni", usersController.getUserByDni);

// POST /users - Create new user
router.post("/", validateSchema(UserSchema), usersController.create);

// PUT /users/:id - Update user (replace)
router.put("/:id", validateId, validateSchema(UserSchema.partial()), usersController.update);

// PATCH /users/:id - Partial update user
router.patch("/:id", validateId, validateSchema(UserSchema.partial()), usersController.patch);

// DELETE /users/:id - Delete user
router.delete("/:id", validateId, usersController.delete);

export default router;
