import express from "express";
import { createPushTokenController } from "@/controllers/pushTokenController";

const router = express.Router();
const controller = createPushTokenController();

router.post("/", controller.register);
router.delete("/:token", (req, _res, next) => {
  req.body = req.body ?? {};
  req.body.token = req.params.token;
  next();
}, controller.unregister);

export default router;
