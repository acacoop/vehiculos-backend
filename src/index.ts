import express, { Request, Response } from "express";
import cors from "cors";

// Import middleware
import { globalErrorHandler } from "./middleware/errorHandler";
import { rateLimiter, sanitizeInput, securityHeaders, corsOptions } from "./middleware/security";
import { setupSwagger } from "./config/swagger";

// Import routes
import usersRoutes from "./routes/users";
import vehiclesRoutes from "./routes/vehicles";
import assignmentsRoutes from "./routes/vehicles/assignments";
import reservationsRoutes from "./routes/reservations";
import vehicleResponsiblesRoutes from "./routes/vehicleResponsibles";
import maintenanceCategoriesRoutes from "./routes/vehicles/maintenance/categories";
import maintenanceRoutes from "./routes/vehicles/maintenance/posibles";
import assignedMaintenanceRoutes from "./routes/vehicles/maintenance/assignments";
import maintenanceRecordsRoutes from "./routes/vehicles/maintenance/records";

import { APP_PORT } from "./config/env.config";

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(rateLimiter);
app.use(sanitizeInput);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup Swagger documentation
setupSwagger(app);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Vehiculos API - Fleet Management System',
    version: '2.0.0',
    documentation: '/docs',
    health: '/health',
    endpoints: {
      users: '/users',
      vehicles: '/vehicles',
      assignments: '/assignments',
      reservations: '/reservations',
      vehicleResponsibles: '/vehicle-responsibles',
      maintenance: {
        categories: '/maintenance/categories',
        posibles: '/maintenance/posibles',
        assignments: '/maintenance/assignments',
        records: '/maintenance/records',
      },
    },
  });
});

// API routes with consistent plural naming
app.use("/users", usersRoutes);
app.use("/vehicles", vehiclesRoutes);
app.use("/assignments", assignmentsRoutes);
app.use("/reservations", reservationsRoutes);
app.use("/vehicle-responsibles", vehicleResponsiblesRoutes);
app.use("/maintenance/categories", maintenanceCategoriesRoutes);
app.use("/maintenance/posibles", maintenanceRoutes);
app.use("/maintenance/assignments", assignedMaintenanceRoutes);
app.use("/maintenance/records", maintenanceRecordsRoutes);

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
    documentation: '/docs'
  });
});

// Global error handler (must be last)
app.use(globalErrorHandler);

// Start server
app.listen(APP_PORT, () => {
  if (process.env.NODE_ENV !== 'development') {
    console.log(`🚗 Vehiculos API Server running on http://localhost:${APP_PORT}`);
    console.log(`📖 API Documentation: http://localhost:${APP_PORT}/docs`);
    console.log(`📊 Health check available at http://localhost:${APP_PORT}/health`);
    console.log(`🐛 Environment: ${process.env.NODE_ENV || 'development'}`);
  } else {
    console.log(`✅ Server ready → http://localhost:${APP_PORT} | Docs: /docs`);
  }
});
