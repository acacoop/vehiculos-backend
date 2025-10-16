import { Router } from "express";
import { meController } from "../controllers/meController";

const router = Router();

// GET /me - current authenticated user
router.get("/", meController.getCurrent);

export default router;
