import express from "express";
import { createPushTokenController } from "@/controllers/pushTokenController";

const router = express.Router();
const controller = createPushTokenController();

router.post("/", controller.register);
router.delete("/", controller.unregister);

export default router;
