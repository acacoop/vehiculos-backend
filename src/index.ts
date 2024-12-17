process.loadEnvFile();
import express, { Request, Response } from "express";
import cors from "cors"; // Import the cors middleware

import userRoutes from "./routes/users";
import vehicleRoutes from "./routes/vehicles";
import assignmentRoutes from "./routes/assignments";
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

app.listen(APP_PORT, () => {
  console.log(`Server is running on http://localhost:${APP_PORT}`);
});
