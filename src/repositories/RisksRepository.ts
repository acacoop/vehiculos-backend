import { DataSource, Repository } from "typeorm";
import { Vehicle } from "@/entities/Vehicle";
import { VehicleResponsible } from "@/entities/VehicleResponsible";
import { QuarterlyControl } from "@/entities/QuarterlyControl";
import { QuarterlyControlItem } from "@/entities/QuarterlyControlItem";
import { MaintenanceRequirement } from "@/entities/MaintenanceRequirement";
import { MaintenanceRecord } from "@/entities/MaintenanceRecord";
import { VehicleKilometers } from "@/entities/VehicleKilometers";
import { QuarterlyControlItemStatus } from "@/enums/QuarterlyControlItemStatusEnum";
import {
  VehicleWithoutResponsible,
  OverdueQuarterlyControl,
  QuarterlyControlWithErrors,
  OverdueMaintenanceVehicleFlat,
  VehicleWithoutRecentKilometers,
  OverdueMaintenanceFilters,
  OverdueQuarterlyControlsFilters,
  QuarterlyControlsWithErrorsFilters,
  VehiclesWithoutRecentKilometersFilters,
  VehiclesWithoutResponsibleFilters,
  RisksSummaryFilters,
  RisksSummary,
  RiskSeverity,
} from "@/schemas/risks";

interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export class RisksRepository {
  private vehicleRepo: Repository<Vehicle>;
  private vehicleResponsibleRepo: Repository<VehicleResponsible>;
  private quarterlyControlRepo: Repository<QuarterlyControl>;
  private quarterlyControlItemRepo: Repository<QuarterlyControlItem>;
  private maintenanceRequirementRepo: Repository<MaintenanceRequirement>;
  private maintenanceRecordRepo: Repository<MaintenanceRecord>;
  private vehicleKilometersRepo: Repository<VehicleKilometers>;

  constructor(dataSource: DataSource) {
    this.vehicleRepo = dataSource.getRepository(Vehicle);
    this.vehicleResponsibleRepo = dataSource.getRepository(VehicleResponsible);
    this.quarterlyControlRepo = dataSource.getRepository(QuarterlyControl);
    this.quarterlyControlItemRepo =
      dataSource.getRepository(QuarterlyControlItem);
    this.maintenanceRequirementRepo = dataSource.getRepository(
      MaintenanceRequirement,
    );
    this.maintenanceRecordRepo = dataSource.getRepository(MaintenanceRecord);
    this.vehicleKilometersRepo = dataSource.getRepository(VehicleKilometers);
  }

  /**
   * Get all risk indicators summary
   */
  async getRisksSummary(filters: RisksSummaryFilters): Promise<RisksSummary[]> {
    const [
      vehiclesWithoutResponsible,
      overdueControls,
      controlsWithErrors,
      overdueMaintenance,
      vehiclesWithoutRecentKilometers,
    ] = await Promise.all([
      this.getVehiclesWithoutResponsibleCount(),
      this.getOverdueQuarterlyControlsCount({
        toleranceDays: filters.toleranceDays,
        limit: 1,
        offset: 0,
      }),
      this.getQuarterlyControlsWithErrorsCount({
        minRejectedItems: 1,
        limit: 1,
        offset: 0,
      }),
      this.getOverdueMaintenanceCount({
        toleranceDays: filters.toleranceDays,
        limit: 1,
        offset: 0,
      }),
      this.getVehiclesWithoutRecentKilometersCount({
        daysWithoutUpdate: filters.daysWithoutUpdate,
        limit: 1,
        offset: 0,
      }),
    ]);

    const severity = (
      count: number,
      level: Exclude<RiskSeverity, "low">,
    ): RiskSeverity => (count > 0 ? level : "low");

    return [
      {
        key: "vehicles-without-responsible",
        label: "Vehículos sin responsable",
        count: vehiclesWithoutResponsible,
        severity: severity(vehiclesWithoutResponsible, "high"),
      },
      {
        key: "overdue-maintenance",
        label: "Mantenimientos vencidos",
        count: overdueMaintenance,
        severity: severity(overdueMaintenance, "high"),
      },
      {
        key: "overdue-quarterly-controls",
        label: "Controles trimestrales vencidos",
        count: overdueControls,
        severity: severity(overdueControls, "high"),
      },
      {
        key: "quarterly-controls-with-errors",
        label: "Controles con rechazos",
        count: controlsWithErrors,
        severity: severity(controlsWithErrors, "medium"),
      },
      {
        key: "vehicles-without-recent-kilometers",
        label: "Sin registro de km reciente",
        count: vehiclesWithoutRecentKilometers,
        severity: severity(vehiclesWithoutRecentKilometers, "medium"),
      },
    ];
  }

  /**
   * Get vehicles without current responsible
   */
  async getVehiclesWithoutResponsible(
    filters: VehiclesWithoutResponsibleFilters,
  ): Promise<PaginatedResult<VehicleWithoutResponsible>> {
    const today = new Date().toISOString().split("T")[0];
    const { limit, offset, search } = filters;

    // Base query builder factory for reuse in count and data queries
    const createBaseQuery = () =>
      this.vehicleRepo
        .createQueryBuilder("v")
        .leftJoin(
          (qb) =>
            qb
              .select("vr.vehicle_id", "vehicle_id")
              .from(VehicleResponsible, "vr")
              .where("vr.start_date <= :today", { today })
              .andWhere("(vr.end_date IS NULL OR vr.end_date >= :today)", {
                today,
              })
              .groupBy("vr.vehicle_id"),
          "active_resp",
          "active_resp.vehicle_id = v.id",
        )
        .where("active_resp.vehicle_id IS NULL");

    // Count query - no need for last_resp join
    const countQuery = createBaseQuery();
    if (search) {
      countQuery.andWhere("v.licensePlate LIKE :search", {
        search: `%${search}%`,
      });
    }
    const total = await countQuery.getCount();

    if (total === 0) {
      return { items: [], total: 0 };
    }

    // Data query with pagination - includes last_resp for lastResponsibleEndDate
    const dataQuery = createBaseQuery()
      .leftJoin(
        (qb) =>
          qb
            .select("vr2.vehicle_id", "vehicle_id")
            .addSelect("MAX(vr2.end_date)", "last_end_date")
            .from(VehicleResponsible, "vr2")
            .groupBy("vr2.vehicle_id"),
        "last_resp",
        "last_resp.vehicle_id = v.id",
      )
      .select("v.id", "id")
      .addSelect("v.id", "vehicleId")
      .addSelect("v.licensePlate", "vehicleLicensePlate")
      .addSelect("last_resp.last_end_date", "lastResponsibleEndDate");

    if (search) {
      dataQuery.andWhere("v.licensePlate LIKE :search", {
        search: `%${search}%`,
      });
    }

    const items = await dataQuery.offset(offset).limit(limit).getRawMany();

    return { items, total };
  }

  async getVehiclesWithoutResponsibleCount(): Promise<number> {
    const today = new Date().toISOString().split("T")[0];

    // Optimized count-only query without the last_resp join
    return this.vehicleRepo
      .createQueryBuilder("v")
      .leftJoin(
        (qb) =>
          qb
            .select("vr.vehicle_id", "vehicle_id")
            .from(VehicleResponsible, "vr")
            .where("vr.start_date <= :today", { today })
            .andWhere("(vr.end_date IS NULL OR vr.end_date >= :today)", {
              today,
            })
            .groupBy("vr.vehicle_id"),
        "active_resp",
        "active_resp.vehicle_id = v.id",
      )
      .where("active_resp.vehicle_id IS NULL")
      .getCount();
  }

  /**
   * Get overdue quarterly controls (past intended date, not filled or with pending items)
   */
  async getOverdueQuarterlyControls(
    filters: OverdueQuarterlyControlsFilters,
  ): Promise<PaginatedResult<OverdueQuarterlyControl>> {
    const toleranceDays = filters.toleranceDays ?? 0;
    const { limit, offset, search } = filters;
    const today = new Date();
    const toleranceDate = new Date(today);
    toleranceDate.setDate(toleranceDate.getDate() - toleranceDays);
    const toleranceDateStr = toleranceDate.toISOString().split("T")[0];

    // Base query factory for count and data queries
    // Overdue = past tolerance date AND (not filled OR has pending items)
    const createBaseQuery = () => {
      const qb = this.quarterlyControlRepo
        .createQueryBuilder("qc")
        .leftJoin("qc.vehicle", "v")
        .leftJoin(
          (subQb) =>
            subQb
              .select("qci.quarterly_control_id", "qc_id")
              .addSelect("COUNT(*)", "total_items")
              .addSelect(
                `SUM(CASE WHEN qci.status = :pendingStatus THEN 1 ELSE 0 END)`,
                "pending_items",
              )
              .from(QuarterlyControlItem, "qci")
              .groupBy("qci.quarterly_control_id"),
          "item_counts",
          "item_counts.qc_id = qc.id",
        )
        .setParameter("pendingStatus", QuarterlyControlItemStatus.PENDIENTE)
        .where("qc.intended_delivery_date < :toleranceDate", {
          toleranceDate: toleranceDateStr,
        })
        .andWhere(
          "(qc.filled_at IS NULL OR COALESCE(item_counts.pending_items, 0) > 0)",
        );

      if (filters.year) {
        qb.andWhere("qc.year = :year", { year: filters.year });
      }
      if (filters.quarter) {
        qb.andWhere("qc.quarter = :quarter", { quarter: filters.quarter });
      }
      if (search) {
        qb.andWhere("v.licensePlate LIKE :search", { search: `%${search}%` });
      }

      return qb;
    };

    // Count query
    const total = await createBaseQuery().getCount();

    if (total === 0) {
      return { items: [], total: 0 };
    }

    // Data query with all fields
    const results = await createBaseQuery()
      .select("qc.id", "id")
      .addSelect("v.id", "vehicleId")
      .addSelect("v.licensePlate", "vehicleLicensePlate")
      .addSelect("qc.year", "year")
      .addSelect("qc.quarter", "quarter")
      .addSelect("qc.intended_delivery_date", "intendedDeliveryDate")
      .addSelect(
        `DATEDIFF(DAY, qc.intended_delivery_date, GETDATE())`,
        "daysOverdue",
      )
      .addSelect("COALESCE(item_counts.pending_items, 0)", "pendingItemsCount")
      .addSelect("COALESCE(item_counts.total_items, 0)", "totalItemsCount")
      .orderBy("qc.intended_delivery_date", "ASC")
      .offset(offset)
      .limit(limit)
      .getRawMany();

    const items = results.map((r) => ({
      id: r.id,
      vehicleId: r.vehicleId,
      vehicleLicensePlate: r.vehicleLicensePlate,
      year: r.year,
      quarter: r.quarter,
      intendedDeliveryDate: r.intendedDeliveryDate,
      daysOverdue: parseInt(r.daysOverdue),
      pendingItemsCount: parseInt(r.pendingItemsCount),
      totalItemsCount: parseInt(r.totalItemsCount),
    }));

    return { items, total };
  }

  async getOverdueQuarterlyControlsCount(
    filters: OverdueQuarterlyControlsFilters,
  ): Promise<number> {
    const toleranceDays = filters.toleranceDays ?? 0;
    const toleranceDate = new Date();
    toleranceDate.setDate(toleranceDate.getDate() - toleranceDays);
    const toleranceDateStr = toleranceDate.toISOString().split("T")[0];

    // Optimized count-only query
    const qb = this.quarterlyControlRepo
      .createQueryBuilder("qc")
      .leftJoin(
        (subQb) =>
          subQb
            .select("qci.quarterly_control_id", "qc_id")
            .addSelect(
              `SUM(CASE WHEN qci.status = :pendingStatus THEN 1 ELSE 0 END)`,
              "pending_items",
            )
            .from(QuarterlyControlItem, "qci")
            .groupBy("qci.quarterly_control_id"),
        "item_counts",
        "item_counts.qc_id = qc.id",
      )
      .setParameter("pendingStatus", QuarterlyControlItemStatus.PENDIENTE)
      .where("qc.intended_delivery_date < :toleranceDate", {
        toleranceDate: toleranceDateStr,
      })
      .andWhere(
        "(qc.filled_at IS NULL OR COALESCE(item_counts.pending_items, 0) > 0)",
      );

    if (filters.year) {
      qb.andWhere("qc.year = :year", { year: filters.year });
    }
    if (filters.quarter) {
      qb.andWhere("qc.quarter = :quarter", { quarter: filters.quarter });
    }

    return qb.getCount();
  }

  /**
   * Get quarterly controls with rejected items
   */
  async getQuarterlyControlsWithErrors(
    filters: QuarterlyControlsWithErrorsFilters,
  ): Promise<PaginatedResult<QuarterlyControlWithErrors>> {
    const minRejectedItems = filters.minRejectedItems ?? 1;
    const { limit, offset, search } = filters;

    const queryBuilder = this.quarterlyControlItemRepo
      .createQueryBuilder("qci")
      .leftJoin("qci.quarterlyControl", "qc")
      .leftJoin("qc.vehicle", "v")
      .select("qc.id", "id")
      .addSelect("v.id", "vehicleId")
      .addSelect("v.license_plate", "vehicleLicensePlate")
      .addSelect("qc.year", "year")
      .addSelect("qc.quarter", "quarter")
      .addSelect("COUNT(*)", "rejectedItemsCount")
      .where("qci.status = :status", {
        status: QuarterlyControlItemStatus.RECHAZADO,
      });

    // Apply optional filters
    if (filters.year) {
      queryBuilder.andWhere("qc.year = :year", { year: filters.year });
    }
    if (filters.quarter) {
      queryBuilder.andWhere("qc.quarter = :quarter", {
        quarter: filters.quarter,
      });
    }
    if (search) {
      queryBuilder.andWhere("v.license_plate LIKE :search", {
        search: `%${search}%`,
      });
    }

    // Esta query tiene GROUP BY y HAVING, paginación en memoria
    const result = await queryBuilder
      .groupBy("qc.id")
      .addGroupBy("v.id")
      .addGroupBy("v.license_plate")
      .addGroupBy("qc.year")
      .addGroupBy("qc.quarter")
      .having("COUNT(*) >= :minRejected", { minRejected: minRejectedItems })
      .orderBy("qc.year", "DESC")
      .addOrderBy("qc.quarter", "DESC")
      .getRawMany();

    const allItems = result.map((row) => ({
      id: row.id,
      vehicleId: row.vehicleId,
      vehicleLicensePlate: row.vehicleLicensePlate,
      year: row.year,
      quarter: row.quarter,
      rejectedItemsCount: parseInt(row.rejectedItemsCount),
    }));

    const total = allItems.length;
    const items = allItems.slice(offset, offset + limit);

    return { items, total };
  }

  async getQuarterlyControlsWithErrorsCount(
    filters: QuarterlyControlsWithErrorsFilters,
  ): Promise<number> {
    const minRejectedItems = filters.minRejectedItems ?? 1;

    // Count query using subquery with GROUP BY/HAVING
    const subQuery = this.quarterlyControlItemRepo
      .createQueryBuilder("qci")
      .leftJoin("qci.quarterlyControl", "qc")
      .leftJoin("qc.vehicle", "v")
      .select("qc.id")
      .where("qci.status = :status", {
        status: QuarterlyControlItemStatus.RECHAZADO,
      });

    if (filters.year) {
      subQuery.andWhere("qc.year = :year", { year: filters.year });
    }
    if (filters.quarter) {
      subQuery.andWhere("qc.quarter = :quarter", { quarter: filters.quarter });
    }

    const result = await subQuery
      .groupBy("qc.id")
      .having("COUNT(*) >= :minRejected", { minRejected: minRejectedItems })
      .getRawMany();

    return result.length;
  }

  async getOverdueMaintenanceCount(
    filters: OverdueMaintenanceFilters,
  ): Promise<number> {
    // Note: This count uses the full method because the "overdue" logic
    // requires complex date/km calculations that involve multiple tables
    // and conditional logic that's impractical to express in pure SQL.
    // The method already calculates total before pagination, so limit:1 avoids
    // building unnecessary result objects.
    const { total } = await this.getOverdueMaintenanceVehicles({
      ...filters,
      limit: 1,
      offset: 0,
    });
    return total;
  }

  /**
   * Get overdue maintenance vehicles (flat, one row per vehicle-requirement pair)
   */
  async getOverdueMaintenanceVehicles(
    filters: OverdueMaintenanceFilters,
  ): Promise<PaginatedResult<OverdueMaintenanceVehicleFlat>> {
    const toleranceDays = filters.toleranceDays ?? 0;
    const { limit, offset, search } = filters;
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Build requirements query with optional filters
    const reqQueryBuilder = this.maintenanceRequirementRepo
      .createQueryBuilder("mr")
      .leftJoinAndSelect("mr.maintenance", "m")
      .leftJoinAndSelect("mr.model", "model")
      .leftJoinAndSelect("model.brand", "brand")
      .where("mr.start_date <= :today", { today: todayStr })
      .andWhere("(mr.end_date IS NULL OR mr.end_date >= :today)", {
        today: todayStr,
      });

    if (filters.maintenanceId) {
      reqQueryBuilder.andWhere("mr.maintenance_id = :maintenanceId", {
        maintenanceId: filters.maintenanceId,
      });
    }
    if (filters.modelId) {
      reqQueryBuilder.andWhere("mr.model_id = :modelId", {
        modelId: filters.modelId,
      });
    }

    const requirements = await reqQueryBuilder.getMany();

    if (requirements.length === 0) {
      return { items: [], total: 0 };
    }

    // Get unique model IDs from requirements to filter vehicles
    const modelIds = [...new Set(requirements.map((r) => r.model.id))];

    // Only load vehicles for models that have active requirements
    const vehicles = await this.vehicleRepo
      .createQueryBuilder("v")
      .leftJoinAndSelect("v.model", "model")
      .where("model.id IN (:...modelIds)", { modelIds })
      .getMany();

    if (vehicles.length === 0) {
      return { items: [], total: 0 };
    }

    // Pre-group vehicles by model ID for O(1) lookup instead of O(n) filter
    const vehiclesByModelId = new Map<string, typeof vehicles>();
    for (const vehicle of vehicles) {
      if (vehicle.model?.id) {
        const list = vehiclesByModelId.get(vehicle.model.id) || [];
        list.push(vehicle);
        vehiclesByModelId.set(vehicle.model.id, list);
      }
    }

    const vehicleIds = vehicles.map((v) => v.id);

    // Get current km only for relevant vehicles
    const vehicleKms = await this.vehicleKilometersRepo
      .createQueryBuilder("vk")
      .select("vk.vehicle_id", "vehicleId")
      .addSelect("vk.kilometers", "kilometers")
      .where("vk.vehicle_id IN (:...vehicleIds)", { vehicleIds })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select("MAX(vk2.date)")
          .from(VehicleKilometers, "vk2")
          .where("vk2.vehicle_id = vk.vehicle_id")
          .getQuery();
        return `vk.date = ${subQuery}`;
      })
      .getRawMany();

    const kmByVehicle = new Map(
      vehicleKms.map((v) => [v.vehicleId, v.kilometers]),
    );

    // Get maintenance IDs from requirements
    const maintenanceIds = [
      ...new Set(requirements.map((r) => r.maintenance.id)),
    ];

    // Batch fetch last maintenance records only for relevant vehicle-maintenance pairs
    const lastRecordsRaw = await this.maintenanceRecordRepo
      .createQueryBuilder("rec")
      .select("rec.vehicle_id", "vehicleId")
      .addSelect("rec.maintenance_id", "maintenanceId")
      .addSelect("rec.date", "date")
      .addSelect("rec.kilometers", "kilometers")
      .where("rec.vehicle_id IN (:...vehicleIds)", { vehicleIds })
      .andWhere("rec.maintenance_id IN (:...maintenanceIds)", {
        maintenanceIds,
      })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select("MAX(rec2.date)")
          .from(MaintenanceRecord, "rec2")
          .where("rec2.vehicle_id = rec.vehicle_id")
          .andWhere("rec2.maintenance_id = rec.maintenance_id")
          .getQuery();
        return `rec.date = ${subQuery}`;
      })
      .getRawMany();

    // Create a map for quick lookup: "vehicleId-maintenanceId" -> { date, kilometers }
    const lastRecordByKey = new Map(
      lastRecordsRaw.map((r) => [
        `${r.vehicleId}-${r.maintenanceId}`,
        { date: r.date, kilometers: r.kilometers },
      ]),
    );

    // Collect all overdue vehicles across all requirements
    const allOverdueVehicles: OverdueMaintenanceVehicleFlat[] = [];

    for (const req of requirements) {
      // Get vehicles for this model from pre-grouped map - O(1) lookup
      const vehiclesForModel = vehiclesByModelId.get(req.model.id) || [];

      for (const vehicle of vehiclesForModel) {
        // Get last maintenance record from the pre-fetched map
        const lastRecord = lastRecordByKey.get(
          `${vehicle.id}-${req.maintenance.id}`,
        );

        const currentKm = kmByVehicle.get(vehicle.id) || 0;
        let isOverdue = false;
        let daysOverdue: number | undefined;
        let kilometersOverdue: number | undefined;
        let dueDate: string | undefined;
        let dueKilometers: number | undefined;

        if (lastRecord) {
          // Check by days
          if (req.daysFrequency) {
            const lastDate = new Date(lastRecord.date);
            const nextDueDate = new Date(lastDate);
            nextDueDate.setDate(nextDueDate.getDate() + req.daysFrequency);
            dueDate = nextDueDate.toISOString().split("T")[0];

            // Add tolerance days
            const toleranceNextDueDate = new Date(nextDueDate);
            toleranceNextDueDate.setDate(
              toleranceNextDueDate.getDate() + toleranceDays,
            );

            if (today > toleranceNextDueDate) {
              isOverdue = true;
              daysOverdue = Math.floor(
                (today.getTime() - nextDueDate.getTime()) /
                  (1000 * 60 * 60 * 24),
              );
            }
          }

          // Check by km
          if (req.kilometersFrequency && lastRecord.kilometers != null) {
            const due = lastRecord.kilometers + req.kilometersFrequency;
            dueKilometers = due;
            if (currentKm > due) {
              isOverdue = true;
              kilometersOverdue = currentKm - due;
            }
          }
        } else {
          // No record at all - use vehicle registration date as base if available
          if (req.daysFrequency && vehicle.registrationDate) {
            const regDate = new Date(vehicle.registrationDate);
            const nextDueDate = new Date(regDate);
            nextDueDate.setDate(nextDueDate.getDate() + req.daysFrequency);
            dueDate = nextDueDate.toISOString().split("T")[0];

            // Add tolerance days
            const toleranceNextDueDate = new Date(nextDueDate);
            toleranceNextDueDate.setDate(
              toleranceNextDueDate.getDate() + toleranceDays,
            );

            if (today > toleranceNextDueDate) {
              isOverdue = true;
              daysOverdue = Math.floor(
                (today.getTime() - nextDueDate.getTime()) /
                  (1000 * 60 * 60 * 24),
              );
            }
          }

          // Check by km - if no record, first maintenance is due at kilometersFrequency
          if (req.kilometersFrequency) {
            dueKilometers = req.kilometersFrequency;
            if (currentKm > dueKilometers) {
              isOverdue = true;
              kilometersOverdue = currentKm - dueKilometers;
            }
          }

          // If no registrationDate for days check, only consider km-based overdue
          // Don't mark as overdue just because there's no record if we can't calculate days
        }

        if (isOverdue) {
          allOverdueVehicles.push({
            id: `${vehicle.id}-${req.id}`,
            vehicleId: vehicle.id,
            vehicleLicensePlate: vehicle.licensePlate,
            maintenanceRequirementId: req.id,
            maintenanceId: req.maintenance.id,
            maintenanceName: req.maintenance.name,
            modelId: req.model.id,
            modelName: req.model.name,
            brandName: req.model.brand?.name || "Sin marca",
            daysFrequency: req.daysFrequency || undefined,
            kilometersFrequency: req.kilometersFrequency || undefined,
            dueDate,
            dueKilometers,
            currentKilometers: currentKm,
            daysOverdue,
            kilometersOverdue,
          });
        }
      }
    }

    // Apply search filter
    let filteredResults = allOverdueVehicles;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredResults = allOverdueVehicles.filter(
        (r) =>
          r.vehicleLicensePlate.toLowerCase().includes(searchLower) ||
          r.maintenanceName.toLowerCase().includes(searchLower) ||
          r.modelName.toLowerCase().includes(searchLower) ||
          r.brandName.toLowerCase().includes(searchLower),
      );
    }

    const total = filteredResults.length;
    const items = filteredResults.slice(offset, offset + limit);

    return { items, total };
  }

  /**
   * Get vehicles without recent kilometer records
   */
  async getVehiclesWithoutRecentKilometers(
    filters: VehiclesWithoutRecentKilometersFilters,
  ): Promise<PaginatedResult<VehicleWithoutRecentKilometers>> {
    const daysWithoutUpdate = filters.daysWithoutUpdate ?? 30;
    const { limit, offset, search } = filters;

    // Base query factory for count and data queries
    const createBaseQuery = () => {
      const latestKmSubquery = this.vehicleKilometersRepo
        .createQueryBuilder("vk")
        .select("vk.vehicle_id", "vehicle_id")
        .addSelect("MAX(vk.date)", "last_date")
        .addSelect("MAX(vk.kilometers)", "last_km")
        .groupBy("vk.vehicle_id");

      const qb = this.vehicleRepo
        .createQueryBuilder("v")
        .leftJoin(
          `(${latestKmSubquery.getQuery()})`,
          "km",
          "km.vehicle_id = v.id",
        )
        .where(
          `(km.last_date IS NULL OR DATEDIFF(DAY, km.last_date, GETDATE()) > :days)`,
          { days: daysWithoutUpdate },
        );

      if (search) {
        qb.andWhere("v.licensePlate LIKE :search", { search: `%${search}%` });
      }

      return qb;
    };

    // Count query
    const total = await createBaseQuery().getCount();

    if (total === 0) {
      return { items: [], total: 0 };
    }

    // Data query with pagination
    const results = await createBaseQuery()
      .select("v.id", "id")
      .addSelect("v.licensePlate", "vehicleLicensePlate")
      .addSelect("km.last_date", "lastKilometerDate")
      .addSelect("km.last_km", "lastKilometers")
      .addSelect(
        `CASE 
          WHEN km.last_date IS NULL THEN -1 
          ELSE DATEDIFF(DAY, km.last_date, GETDATE()) 
        END`,
        "daysSinceLastUpdate",
      )
      .offset(offset)
      .limit(limit)
      .getRawMany();

    const items = results.map((r) => ({
      id: r.id,
      vehicleId: r.id,
      vehicleLicensePlate: r.vehicleLicensePlate,
      lastKilometerDate: r.lastKilometerDate
        ? new Date(r.lastKilometerDate).toISOString().split("T")[0]
        : undefined,
      lastKilometers: r.lastKilometers ?? undefined,
      daysSinceLastUpdate: r.daysSinceLastUpdate,
    }));

    return { items, total };
  }

  async getVehiclesWithoutRecentKilometersCount(
    filters: VehiclesWithoutRecentKilometersFilters,
  ): Promise<number> {
    const daysWithoutUpdate = filters.daysWithoutUpdate ?? 30;

    // Optimized count-only query
    const latestKmSubquery = this.vehicleKilometersRepo
      .createQueryBuilder("vk")
      .select("vk.vehicle_id", "vehicle_id")
      .addSelect("MAX(vk.date)", "last_date")
      .groupBy("vk.vehicle_id");

    return this.vehicleRepo
      .createQueryBuilder("v")
      .leftJoin(
        `(${latestKmSubquery.getQuery()})`,
        "km",
        "km.vehicle_id = v.id",
      )
      .where(
        `(km.last_date IS NULL OR DATEDIFF(DAY, km.last_date, GETDATE()) > :days)`,
        { days: daysWithoutUpdate },
      )
      .getCount();
  }
}
