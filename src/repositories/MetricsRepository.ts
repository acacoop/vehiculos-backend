import { DataSource, Repository, MoreThanOrEqual, IsNull } from "typeorm";
import { Vehicle } from "@/entities/Vehicle";
import { Reservation } from "@/entities/Reservation";
import { MaintenanceRecord } from "@/entities/MaintenanceRecord";
import { QuarterlyControl } from "@/entities/QuarterlyControl";
import { QuarterlyControlItem } from "@/entities/QuarterlyControlItem";
import { Assignment } from "@/entities/Assignment";
import { VehicleResponsible } from "@/entities/VehicleResponsible";
import { VehicleKilometers } from "@/entities/VehicleKilometers";
import { VehicleBrand } from "@/entities/VehicleBrand";
import { QuarterlyControlItemStatus } from "@/enums/QuarterlyControlItemStatusEnum";
import {
  Bucket,
  DistributionItem,
  TimelineItem,
  QuarterlyControlMetric,
} from "@/schemas/metrics";

export class MetricsRepository {
  private vehicleRepo: Repository<Vehicle>;
  private vehicleKilometersRepo: Repository<VehicleKilometers>;
  private reservationRepo: Repository<Reservation>;
  private maintenanceRecordRepo: Repository<MaintenanceRecord>;
  private quarterlyControlRepo: Repository<QuarterlyControl>;
  private quarterlyControlItemRepo: Repository<QuarterlyControlItem>;
  private assignmentRepo: Repository<Assignment>;
  private vehicleResponsibleRepo: Repository<VehicleResponsible>;
  private vehicleBrandRepo: Repository<VehicleBrand>;

  constructor(dataSource: DataSource) {
    this.vehicleRepo = dataSource.getRepository(Vehicle);
    this.vehicleKilometersRepo = dataSource.getRepository(VehicleKilometers);
    this.reservationRepo = dataSource.getRepository(Reservation);
    this.maintenanceRecordRepo = dataSource.getRepository(MaintenanceRecord);
    this.quarterlyControlRepo = dataSource.getRepository(QuarterlyControl);
    this.quarterlyControlItemRepo =
      dataSource.getRepository(QuarterlyControlItem);
    this.assignmentRepo = dataSource.getRepository(Assignment);
    this.vehicleResponsibleRepo = dataSource.getRepository(VehicleResponsible);
    this.vehicleBrandRepo = dataSource.getRepository(VehicleBrand);
  }

  // ============================================
  // Vehicle Metrics
  // ============================================

  /**
   * Get vehicle count
   */
  async getVehicleCount(): Promise<number> {
    return this.vehicleRepo.count();
  }

  /**
   * Get vehicles by kilometer buckets (dynamic)
   */
  async getVehiclesByKilometerBuckets(
    bucketSize: number = 20000,
    maxBuckets: number = 10,
  ): Promise<Bucket[]> {
    // Get latest kilometers for each vehicle using raw SQL for MSSQL compatibility
    const latestKilometers = await this.vehicleKilometersRepo
      .createQueryBuilder("vk")
      .select("vk.kilometers", "kilometers")
      .where(
        `vk.date = (
          SELECT MAX(vk2.date) 
          FROM vehicle_kilometers vk2 
          WHERE vk2.vehicle_id = vk.vehicle_id
        )`,
      )
      .getRawMany();

    // Count vehicles without kilometer records
    const vehiclesWithKms = await this.vehicleKilometersRepo
      .createQueryBuilder("vk")
      .select("DISTINCT vk.vehicle_id", "vehicle_id")
      .getRawMany();

    const vehicleIdsWithKms = new Set(vehiclesWithKms.map((v) => v.vehicle_id));
    const allVehicles = await this.vehicleRepo.find({ select: ["id"] });
    const vehiclesWithoutKms = allVehicles.filter(
      (v) => !vehicleIdsWithKms.has(v.id),
    ).length;

    // Build buckets
    const buckets: Bucket[] = [];
    const kmValues = latestKilometers.map((r) => r.kilometers as number);

    for (let i = 0; i < maxBuckets; i++) {
      const min = i * bucketSize;
      const max = (i + 1) * bucketSize;
      const isLast = i === maxBuckets - 1;

      const count = isLast
        ? kmValues.filter((km) => km >= min).length
        : kmValues.filter((km) => km >= min && km < max).length;

      if (count > 0 || i < 5) {
        // Always show first 5 buckets
        buckets.push({
          label: isLast
            ? `${(min / 1000).toFixed(0)}k+ km`
            : `${(min / 1000).toFixed(0)}k-${(max / 1000).toFixed(0)}k km`,
          min,
          max: isLast ? null : max,
          count,
        });
      }
    }

    // Add "Sin registro" bucket if there are vehicles without km
    if (vehiclesWithoutKms > 0) {
      buckets.push({
        label: "Sin registro",
        min: -1,
        max: -1,
        count: vehiclesWithoutKms,
      });
    }

    return buckets;
  }

  /**
   * Get vehicles by age buckets (dynamic)
   */
  async getVehiclesByAgeBuckets(
    bucketSize: number = 1,
    maxBuckets: number = 10,
  ): Promise<Bucket[]> {
    const currentYear = new Date().getFullYear();

    const vehicles = await this.vehicleRepo.find({ select: ["year"] });
    const ages = vehicles.map((v) => currentYear - v.year);

    const buckets: Bucket[] = [];

    for (let i = 0; i < maxBuckets; i++) {
      const min = i * bucketSize;
      const max = (i + 1) * bucketSize;
      const isLast = i === maxBuckets - 1;

      const count = isLast
        ? ages.filter((age) => age >= min).length
        : ages.filter((age) => age >= min && age < max).length;

      if (count > 0 || i < 5) {
        // Always show first 5 buckets
        const label =
          bucketSize === 1
            ? isLast
              ? `${min}+ años`
              : `${min} año${min !== 1 ? "s" : ""}`
            : isLast
              ? `${min}+ años`
              : `${min}-${max - 1} años`;

        buckets.push({
          label,
          min,
          max: isLast ? null : max,
          count,
        });
      }
    }

    return buckets;
  }

  /**
   * Get vehicles by fuel type distribution
   */
  async getVehiclesByFuelType(): Promise<DistributionItem[]> {
    const result = await this.vehicleRepo
      .createQueryBuilder("v")
      .select("v.fuelType", "fuelType")
      .addSelect("COUNT(*)", "count")
      .groupBy("v.fuelType")
      .orderBy("count", "DESC")
      .getRawMany();

    return result.map((row) => ({
      id: row.fuelType || null,
      name: row.fuelType || "No especificado",
      count: parseInt(row.count),
    }));
  }

  /**
   * Get vehicles by brand distribution
   */
  async getVehiclesByBrand(): Promise<DistributionItem[]> {
    const result = await this.vehicleRepo
      .createQueryBuilder("v")
      .leftJoin("v.model", "m")
      .leftJoin("m.brand", "b")
      .select("b.id", "brandId")
      .addSelect("b.name", "brandName")
      .addSelect("COUNT(*)", "count")
      .groupBy("b.id")
      .addGroupBy("b.name")
      .orderBy("count", "DESC")
      .getRawMany();

    return result.map((row) => ({
      id: row.brandId || null,
      name: row.brandName || "Sin marca",
      count: parseInt(row.count),
    }));
  }

  // ============================================
  // Management Metrics
  // ============================================

  /**
   * Get reservations by month timeline
   */
  async getReservationsByMonth(months: number = 12): Promise<TimelineItem[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const reservations = await this.reservationRepo.find({
      where: {
        startDate: MoreThanOrEqual(startDate.toISOString()),
      },
      select: ["startDate"],
    });

    return this.groupByMonth(
      reservations.map((r) => new Date(r.startDate)),
      months,
    );
  }

  /**
   * Get maintenance records by month timeline
   */
  async getMaintenanceRecordsByMonth(
    months: number = 12,
  ): Promise<TimelineItem[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const records = await this.maintenanceRecordRepo.find({
      where: {
        date: MoreThanOrEqual(startDate.toISOString().split("T")[0]),
      },
      select: ["date"],
    });

    return this.groupByMonth(
      records.map((r) => new Date(r.date)),
      months,
    );
  }

  // ============================================
  // Quarterly Control Metrics
  // ============================================

  /**
   * Get quarterly controls aggregated by status
   * @param periods - Number of quarters to return (default: 8 = 2 years)
   */
  async getQuarterlyControlsByStatus(
    periods: number = 8,
  ): Promise<QuarterlyControlMetric[]> {
    const qb = this.quarterlyControlRepo
      .createQueryBuilder("qc")
      .leftJoinAndSelect("qc.items", "qci")
      .orderBy("qc.year", "DESC")
      .addOrderBy("qc.quarter", "DESC");

    const controls = await qb.getMany();

    // Group by year-quarter
    const grouped = new Map<string, QuarterlyControlMetric>();

    for (const control of controls) {
      const key = `${control.year}-Q${control.quarter}`;
      const isOverdue =
        new Date(control.intendedDeliveryDate) < new Date() &&
        !control.filledAt;

      if (!grouped.has(key)) {
        grouped.set(key, {
          year: control.year,
          quarter: control.quarter,
          label: key,
          total: 0,
          aprobados: 0,
          pendientes: 0,
          rechazados: 0,
          vencidos: 0,
        });
      }

      const metric = grouped.get(key)!;
      metric.total++;

      if (isOverdue) {
        metric.vencidos++;
      } else if (control.items) {
        const hasRejected = control.items.some(
          (item) => item.status === QuarterlyControlItemStatus.RECHAZADO,
        );
        const allApproved = control.items.every(
          (item) => item.status === QuarterlyControlItemStatus.APROBADO,
        );
        const hasPending = control.items.some(
          (item) => item.status === QuarterlyControlItemStatus.PENDIENTE,
        );

        if (hasRejected) {
          metric.rechazados++;
        } else if (allApproved && control.items.length > 0) {
          metric.aprobados++;
        } else if (hasPending) {
          metric.pendientes++;
        }
      }
    }

    // Return only the requested number of periods
    return Array.from(grouped.values()).slice(0, periods);
  }

  // ============================================
  // Personnel Metrics
  // ============================================

  /**
   * Get current active driver assignments count
   */
  async getActiveDriversCount(): Promise<number> {
    const now = new Date();
    return this.assignmentRepo.count({
      where: [
        { endDate: IsNull() },
        { endDate: MoreThanOrEqual(now.toISOString().split("T")[0]) },
      ],
    });
  }

  async getDriverAssignmentsByMonth(
    months: number = 12,
  ): Promise<TimelineItem[]> {
    const assignments = await this.assignmentRepo.find({
      select: ["startDate", "endDate"],
    });
    return this.countActiveByMonth(assignments, months);
  }

  async getActiveResponsiblesCount(): Promise<number> {
    const now = new Date();
    return this.vehicleResponsibleRepo.count({
      where: [
        { endDate: IsNull() },
        { endDate: MoreThanOrEqual(now.toISOString().split("T")[0]) },
      ],
    });
  }

  async getResponsiblesByMonth(months: number = 12): Promise<TimelineItem[]> {
    const responsibles = await this.vehicleResponsibleRepo.find({
      select: ["startDate", "endDate"],
    });
    return this.countActiveByMonth(responsibles, months);
  }

  private countActiveByMonth(
    items: { startDate: Date | string; endDate: Date | string | null }[],
    months: number,
  ): TimelineItem[] {
    const now = new Date();
    const timeline: TimelineItem[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const key = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;

      const count = items.filter((item) => {
        const start = new Date(item.startDate);
        const end = item.endDate ? new Date(item.endDate) : null;
        return start <= monthEnd && (!end || end >= monthStart);
      }).length;

      timeline.push({ month: key, count });
    }

    return timeline;
  }

  /**
   * Group dates by month and return timeline
   */
  private groupByMonth(dates: Date[], months: number): TimelineItem[] {
    const timeline: Map<string, number> = new Map();

    // Initialize all months with 0
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      timeline.set(key, 0);
    }

    // Count dates per month
    for (const date of dates) {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (timeline.has(key)) {
        timeline.set(key, (timeline.get(key) || 0) + 1);
      }
    }

    return Array.from(timeline.entries()).map(([month, count]) => ({
      month,
      count,
    }));
  }
}
