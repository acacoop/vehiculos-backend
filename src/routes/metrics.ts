import { Router } from "express";
import { createMetricsController } from "@/controllers/metricsController";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = Router();
const metricsController = createMetricsController();

// All metrics endpoints require ADMIN role
router.use(requireRole(UserRoleEnum.ADMIN));

// ============================================
// Vehicle Metrics
// ============================================

/**
 * GET /metrics/vehicles/count
 * Returns total vehicle count
 */
router.get("/vehicles/count", metricsController.getVehicleCount);

/**
 * GET /metrics/vehicles/kilometers
 * Returns vehicles by kilometer buckets (dynamic)
 * Query params:
 *   - bucketSize: number (default: 20000) - Size of each bucket in km
 *   - maxBuckets: number (default: 10, max: 20) - Maximum number of buckets
 */
router.get("/vehicles/kilometers", metricsController.getVehiclesByKilometers);

/**
 * GET /metrics/vehicles/age
 * Returns vehicles by age buckets (dynamic)
 * Query params:
 *   - bucketSize: number (default: 1) - Size of each bucket in years
 *   - maxBuckets: number (default: 10, max: 20) - Maximum number of buckets
 */
router.get("/vehicles/age", metricsController.getVehiclesByAge);

/**
 * GET /metrics/vehicles/fuel-type
 * Returns vehicles by fuel type distribution
 */
router.get("/vehicles/fuel-type", metricsController.getVehiclesByFuelType);

/**
 * GET /metrics/vehicles/brand
 * Returns vehicles by brand distribution
 * Response includes brandId for drill-down using GET /vehicles?brandId=xxx
 */
router.get("/vehicles/brand", metricsController.getVehiclesByBrand);

// ============================================
// Management Metrics
// ============================================

/**
 * GET /metrics/reservations
 * Returns reservations timeline by month
 * Query params:
 *   - months: number (default: 12, max: 36) - Number of months to include
 * Note: For drill-down, use GET /reservations with date filters
 */
router.get("/reservations", metricsController.getReservationsTimeline);

/**
 * GET /metrics/maintenance-records
 * Returns maintenance records timeline by month
 * Query params:
 *   - months: number (default: 12, max: 36) - Number of months to include
 * Note: For drill-down, use GET /maintenance/records with date filters
 */
router.get(
  "/maintenance-records",
  metricsController.getMaintenanceRecordsTimeline,
);

// ============================================
// Quarterly Control Metrics
// ============================================

/**
 * GET /metrics/quarterly-controls
 * Returns quarterly controls by status
 * Query params:
 *   - periods: number (default: 8, max: 20) - Number of quarters to show
 * Note: For drill-down, use GET /quarterly-controls with filters
 */
router.get("/quarterly-controls", metricsController.getQuarterlyControlsStatus);

// ============================================
// Personnel Metrics
// ============================================

/**
 * GET /metrics/drivers
 * Returns assigned drivers metrics (current count + timeline)
 * Query params:
 *   - months: number (default: 12, max: 36) - Number of months for timeline
 * Note: For drill-down, use GET /assignments with filters
 */
router.get("/drivers", metricsController.getDriversMetrics);

/**
 * GET /metrics/responsibles
 * Returns assigned responsibles metrics (current count + timeline)
 * Query params:
 *   - months: number (default: 12, max: 36) - Number of months for timeline
 * Note: For drill-down, use GET /vehicle-responsibles with filters
 */
router.get("/responsibles", metricsController.getResponsiblesMetrics);

export default router;
