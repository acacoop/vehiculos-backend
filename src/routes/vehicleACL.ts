import { Router } from "express";
import { VehicleACLController } from "@/controllers/vehicleACLController";
import { VehicleACLService } from "@/services/vehicleACLService";
import { VehicleACLRepository } from "@/repositories/VehicleACLRepository";
import { AppDataSource } from "@/db";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = Router();

const repository = new VehicleACLRepository(AppDataSource);
const service = new VehicleACLService(repository);
const controller = new VehicleACLController(service);

router.use(requireRole(UserRoleEnum.ADMIN));

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.delete);

router.get("/user/:userId/active", controller.getActiveForUser);

export default router;
