import "reflect-metadata";
import express, { Request, Response } from "express";
import cors from "cors";

// Import middleware
import { globalErrorHandler } from "@/middleware/errorHandler";
import {
  rateLimiter,
  sanitizeInput,
  securityHeaders,
  corsOptions,
} from "@/middleware/security";
import { setupSwagger } from "@/config/swagger";
import { requireAuth } from "@/middleware/auth";
import meRoutes from "@/routes/me";

// Import routes
import usersRoutes from "@/routes/users";
import vehiclesRoutes from "@/routes/vehicles";
import assignmentsRoutes from "@/routes/vehicleAssignments";
import reservationsRoutes from "@/routes/reservations";
import vehicleResponsiblesRoutes from "@/routes/vehicleResponsibles";
import userRolesRoutes from "@/routes/userRoles";
import maintenanceCategoriesRoutes from "@/routes/maintenanceCategories";
import maintenanceRoutes from "@/routes/maintenancePosibles";
import assignedMaintenanceRoutes from "@/routes/maintenanceAssignments";
import maintenanceRecordsRoutes from "@/routes/maintenanceRecords";
import vehicleKilometersRoutes from "@/routes/vehicleKilometers";
import vehicleBrandsRoutes from "@/routes/vehicleBrands";
import vehicleModelsRoutes from "@/routes/vehicleModels";
import vehicleACLRoutes from "@/routes/vehicleACL";

import { SERVER_PORT } from "@/config/env.config";
import { AppDataSource, initializeDatabase } from "@/db";

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(rateLimiter);
app.use(sanitizeInput);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Setup Swagger documentation
setupSwagger(app);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint: simple project info (no endpoint listing)
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    name: "Vehiculos API",
    description: "Fleet management backend for ACA Coop",
    version: "2.0.0",
    documentation: "/docs",
    health: "/health",
  });
});

// API routes with consistent plural naming
// Require authentication for all API routes after this point
app.use(requireAuth);

app.use("/me", meRoutes);

app.use("/users", usersRoutes);
app.use("/vehicles", vehiclesRoutes);
app.use("/assignments", assignmentsRoutes);
app.use("/reservations", reservationsRoutes);
app.use("/vehicle-responsibles", vehicleResponsiblesRoutes);
app.use("/user-roles", userRolesRoutes);
app.use("/vehicle-brands", vehicleBrandsRoutes);
app.use("/vehicle-models", vehicleModelsRoutes);
app.use("/vehicle-acl", vehicleACLRoutes);
app.use("/maintenance/categories", maintenanceCategoriesRoutes);
app.use("/maintenance/posibles", maintenanceRoutes);
app.use("/maintenance/assignments", assignedMaintenanceRoutes);
app.use("/maintenance/records", maintenanceRecordsRoutes);
app.use("/vehicles/kilometers", vehicleKilometersRoutes);

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.originalUrl} not found`,
    documentation: "/docs",
  });
});

// Global error handler (must be last)
app.use(globalErrorHandler);

// Start server only after database is connected
async function startServer() {
  try {
    // Wait for database connection
    console.log("⏳ Initializing database connection...");
    await initializeDatabase();

    if (!AppDataSource.isInitialized) {
      throw new Error("Database failed to initialize");
    }

    console.log("✅ Database connected successfully");

    // Start Express server
    app.listen(SERVER_PORT, "0.0.0.0", () => {
      if (process.env.NODE_ENV !== "development") {
        console.log(
          `🚗 Vehiculos API Server running on http://localhost:${SERVER_PORT}`,
        );
        console.log(
          `📖 API Documentation: http://localhost:${SERVER_PORT}/docs`,
        );
        console.log(
          `📊 Health check available at http://localhost:${SERVER_PORT}/health`,
        );
        console.log(`🐛 Environment: ${process.env.NODE_ENV || "development"}`);
      } else {
        console.log(
          `✅ Server ready → http://localhost:${SERVER_PORT} | Docs: /docs`,
        );
      }
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Only start server if not in test mode
if (!process.env.JEST_WORKER_ID) {
  startServer();
}
