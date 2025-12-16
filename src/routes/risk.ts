import { Router } from "express";
import { createRiskController } from "@/controllers/riskController";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = Router();
const riskController = createRiskController();

router.use(requireRole(UserRoleEnum.ADMIN));

router.get("/summary", riskController.getSummary);
router.get(
  "/vehicles-without-responsible",
  riskController.getVehiclesWithoutResponsible,
);
router.get("/overdue-maintenance", riskController.getOverdueMaintenance);
router.get(
  "/overdue-quarterly-controls",
  riskController.getOverdueQuarterlyControls,
);
router.get(
  "/quarterly-controls-with-errors",
  riskController.getQuarterlyControlsWithErrors,
);

export default router;
