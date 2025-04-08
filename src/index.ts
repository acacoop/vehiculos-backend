process.loadEnvFile();
import express, { Request, Response } from "express";
import cors from "cors"; // Import the cors middleware

import userRoutes from "./routes/users";
import vehicleRoutes from "./routes/vehicles/vehicle";
import assignmentRoutes from "./routes/vehicles/assignments";
import reservationRoutes from "./routes/reservations";
import maintenanceCategoriesRoutes from "./routes/vehicles/maintenance/posibles";
import maintenanceRoutes from "./routes/vehicles/maintenance/posibles";
import assignedMaintenanceRoutes from "./routes/vehicles/maintenance/assignments";
import maintenanceRecordRoutes from "./routes/vehicles/maintenance/records";
import { APP_PORT } from "./config/env.config";

const app = express();

app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World Vehiculos");
});

app.use(express.json());
app.use("/users", userRoutes);
app.use("/vehicles", vehicleRoutes);
app.use("/assignments", assignmentRoutes);
app.use("/reservations", reservationRoutes);
app.use("/maintenance/catergories", maintenanceCategoriesRoutes);
app.use("/maintenance/posibles", maintenanceRoutes);
app.use("/maintenance/assignations", assignedMaintenanceRoutes);
app.use("/maintenance/records", maintenanceRecordRoutes);

app.listen(APP_PORT, () => {
  console.log(`Server is running on http://localhost:${APP_PORT}`);
});
