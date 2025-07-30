import express from "express";
import { maintenanceCategoriesController } from "../../../controllers/maintenanceCategoriesController";

const router = express.Router();

// GET: Fetch all maintenance categories
router.get("/", maintenanceCategoriesController.getAll);

export default router;
