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

// GET: Fetch all reservations with pagination and search
router.get("/", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Extract search parameters (excluding pagination params)
    const searchParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'page' && key !== 'limit' && typeof value === 'string') {
        searchParams[key] = value;
      }
    }

    const { items, total } = await getAllReservations({ limit, offset, searchParams });
    
    res.status(200).json({
      status: 'success',
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
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
