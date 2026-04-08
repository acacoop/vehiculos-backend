import express from "express";
import { createPushTokenController } from "@/controllers/pushTokenController";
import { validateBody } from "@/middleware/validation";
import { PushTokenSchema, PushTokenDeleteSchema } from "@/schemas/pushToken";

const router = express.Router();
const controller = createPushTokenController();

router.post("/", validateBody(PushTokenSchema), controller.register);
router.delete("/", validateBody(PushTokenDeleteSchema), controller.unregister);
export default router;
