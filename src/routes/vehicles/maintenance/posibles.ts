import express from "express";
import { maintenancePosiblesController } from "../../../controllers/maintenancePosiblesController";

const router = express.Router();

// GET: Fetch all possible maintenances
router.get("/", maintenancePosiblesController.getAll);

export default router;
