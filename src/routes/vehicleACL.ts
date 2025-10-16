import { Router } from "express";
import { VehicleACLController } from "../controllers/vehicleACLController";
import { VehicleACLService } from "../services/vehicleACLService";
import { VehicleACLRepository } from "../repositories/VehicleACLRepository";
import { AppDataSource } from "../db";
import { requireRole } from "../middleware/permission";
import { UserRoleEnum } from "../utils/common";

const router = Router();

// Create service instance
const repository = new VehicleACLRepository(AppDataSource);
const service = new VehicleACLService(repository);
const controller = new VehicleACLController(service);

// All routes require ADMIN role
router.use(requireRole(UserRoleEnum.ADMIN));

// CRUD operations
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.patch("/:id", controller.patch);
router.delete("/:id", controller.delete);

// Custom routes
router.get("/user/:userId/active", controller.getActiveForUser);

export default router;
