import express from "express";
import { validateUUIDParam } from "../middleware/validation";
import { createReservationsController } from "../controllers/reservationsController";
import { ReservationSchema } from "../schemas/reservation";

const router = express.Router();
const controller = createReservationsController();

// GET: Fetch all reservations with pagination and search
router.get("/", controller.getAll);

// GET: Fetch reservations for a specific user
router.get("/user/:id", validateUUIDParam("id"), controller.getByUser);

// GET: Fetch reservations for a specific vehicle
router.get("/vehicle/:id", validateUUIDParam("id"), controller.getByVehicle);

// GET: Fetch reservations for all vehicles assigned to a specific user
router.get(
  "/user/:id/assigned",
  validateUUIDParam("id"),
  controller.getAssignedVehicles,
);

// GET: Fetch reservations for a specific user that are scheduled for today
router.get(
  "/user/:id/today",
  validateUUIDParam("id"),
  controller.getTodayByUser,
);

// POST: Create a new reservation
router.post("/", (req, res, next) => {
  try {
    ReservationSchema.parse(req.body);
  } catch (e) {
    return next(e);
  }
  return controller.create(req, res, next);
});

export default router;
