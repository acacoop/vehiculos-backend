import { MetricsRepository } from "@/repositories/MetricsRepository";
import {
  KilometersMetricsQuery,
  AgeMetricsQuery,
  TimelineMetricsQuery,
  QuarterlyControlMetricsQuery,
  Bucket,
  DistributionItem,
  TimelineItem,
  QuarterlyControlMetric,
  PersonnelMetric,
} from "@/schemas/metrics";

export class MetricsService {
  constructor(private readonly metricsRepo: MetricsRepository) {}

  // ============================================
  // Vehicle Metrics
  // ============================================

  /**
   * Get total vehicle count
   */
  async getVehicleCount(): Promise<{ total: number }> {
    const total = await this.metricsRepo.getVehicleCount();
    return { total };
  }

  /**
   * Get vehicles by kilometer buckets
   */
  async getVehiclesByKilometers(
    query: KilometersMetricsQuery,
  ): Promise<{ buckets: Bucket[] }> {
    const buckets = await this.metricsRepo.getVehiclesByKilometerBuckets(
      query.bucketSize,
      query.maxBuckets,
      query.minBucketsToShow,
    );
    return { buckets };
  }

  /**
   * Get vehicles by age buckets
   */
  async getVehiclesByAge(
    query: AgeMetricsQuery,
  ): Promise<{ buckets: Bucket[] }> {
    const buckets = await this.metricsRepo.getVehiclesByAgeBuckets(
      query.bucketSize,
      query.maxBuckets,
      query.minBucketsToShow,
    );
    return { buckets };
  }

  /**
   * Get vehicles by fuel type distribution
   */
  async getVehiclesByFuelType(
    limit?: number,
  ): Promise<{ distribution: DistributionItem[] }> {
    const distribution = await this.metricsRepo.getVehiclesByFuelType(limit);
    return { distribution };
  }

  /**
   * Get vehicles by brand distribution
   */
  async getVehiclesByBrand(
    limit?: number,
  ): Promise<{ distribution: DistributionItem[] }> {
    const distribution = await this.metricsRepo.getVehiclesByBrand(limit);
    return { distribution };
  }

  // ============================================
  // Management Metrics
  // ============================================

  /**
   * Get reservations timeline by month
   */
  async getReservationsTimeline(
    query: TimelineMetricsQuery,
  ): Promise<{ timeline: TimelineItem[] }> {
    const timeline = await this.metricsRepo.getReservationsByMonth(
      query.months,
    );
    return { timeline };
  }

  /**
   * Get maintenance records timeline by month
   */
  async getMaintenanceRecordsTimeline(
    query: TimelineMetricsQuery,
  ): Promise<{ timeline: TimelineItem[] }> {
    const timeline = await this.metricsRepo.getMaintenanceRecordsByMonth(
      query.months,
    );
    return { timeline };
  }

  // ============================================
  // Quarterly Control Metrics
  // ============================================

  /**
   * Get quarterly controls by status
   */
  async getQuarterlyControlsStatus(
    query: QuarterlyControlMetricsQuery,
  ): Promise<{ metrics: QuarterlyControlMetric[] }> {
    const metrics = await this.metricsRepo.getQuarterlyControlsByStatus(
      query.periods,
    );
    return { metrics };
  }

  // ============================================
  // Personnel Metrics
  // ============================================

  /**
   * Get assigned drivers metrics
   */
  async getDriversMetrics(
    query: TimelineMetricsQuery,
  ): Promise<PersonnelMetric> {
    const [totalActual, timeline] = await Promise.all([
      this.metricsRepo.getActiveDriversCount(),
      this.metricsRepo.getDriverAssignmentsByMonth(query.months),
    ]);
    return { totalActual, timeline };
  }

  /**
   * Get assigned responsibles metrics
   */
  async getResponsiblesMetrics(
    query: TimelineMetricsQuery,
  ): Promise<PersonnelMetric> {
    const [totalActual, timeline] = await Promise.all([
      this.metricsRepo.getActiveResponsiblesCount(),
      this.metricsRepo.getResponsiblesByMonth(query.months),
    ]);
    return { totalActual, timeline };
  }
}
