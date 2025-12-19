import { Router } from "express";
import { createRisksController } from "@/controllers/risksController";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = Router();
const risksController = createRisksController();

router.use(requireRole(UserRoleEnum.ADMIN));

router.get("/summary", risksController.getSummary);

router.get(
  "/vehicles-without-responsible",
  risksController.getVehiclesWithoutResponsible,
);

router.get("/overdue-maintenance", risksController.getOverdueMaintenance);

router.get(
  "/overdue-maintenance-vehicles",
  risksController.getOverdueMaintenanceVehicles,
);

router.get(
  "/overdue-quarterly-controls",
  risksController.getOverdueQuarterlyControls,
);

router.get(
  "/quarterly-controls-with-errors",
  risksController.getQuarterlyControlsWithErrors,
);

router.get(
  "/vehicles-without-recent-kilometers",
  risksController.getVehiclesWithoutRecentKilometers,
);

export default router;
