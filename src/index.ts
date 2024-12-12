import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";

import userRoutes from "./routes/users";
import vehicleRoutes from "./routes/vehicles";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World Vehiculos");
});

app.use(express.json());
app.use("/users", userRoutes);
app.use("/vehicles", vehicleRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
