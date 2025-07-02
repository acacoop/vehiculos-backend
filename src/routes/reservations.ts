import express, { Request, Response } from "express";
import {
  addReservation,
  getAllReservations,
  getReservationsByUserId,
  getReservationsByVehicleId,
  getReservatiosOfAssignedVehiclesByUserId,
  getTodayReservationsByUserId,
} from "../services/reservationsService";
import { ReservationSchema } from "../schemas/reservation";
import { Reservation } from "../interfaces/reservation";
import { validateId } from "../middleware/validation";

const router = express.Router();

// GET: Fetch all users
router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await getAllReservations();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// GET: Fetch reservations for a specific user
router.get("/user/:id", validateId, async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const vehicles = await getReservationsByUserId(id);
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// GET: Fetch reservations for a specific vehicle
router.get("/vehicle/:id", validateId, async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const vehicles = await getReservationsByVehicleId(id);
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// GET: Fetch reservations for all vehicles assigned to a specific user  
router.get("/user/:id/assigned", validateId, async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const vehicles = await getReservatiosOfAssignedVehiclesByUserId(id);
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// GET: Fetch reservations for a specific user that are scheduled for today
router.get("/user/:id/today", validateId, async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const vehicles = await getTodayReservationsByUserId(id);
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

// POST: Create a new reservation
router.post("/", async (req: Request, res: Response) => {
  const reservation: Reservation = ReservationSchema.parse(req.body);

  try {
    const newReservation = await addReservation(reservation);
    res.status(201).json(newReservation);
  } catch (error) {
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

export default router;
