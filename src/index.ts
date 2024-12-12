import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";

import userRoutes from "./routes/users";
// import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript with Express!");
});

// app.use(bodyParser.json());
app.use("/users", userRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
