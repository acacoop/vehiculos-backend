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
        limit: 99999,
        offset: 0,
      }),
      this.getVehiclesWithoutRecentKilometersCount({
        daysWithoutUpdate: filters.daysWithoutUpdate,
        limit: 1,
        offset: 0,
      }),
    ]);

    return [
      {
        key: "vehicles-without-responsible",
        label: "Vehículos sin responsable",
        count: vehiclesWithoutResponsible,
        severity: vehiclesWithoutResponsible > 0 ? "high" : "low",
      },
      {
        key: "overdue-maintenance",
        label: "Mantenimientos vencidos",
        count: overdueMaintenance,
        severity: overdueMaintenance > 0 ? "high" : "low",
      },
      {
        key: "overdue-quarterly-controls",
        label: "Controles trimestrales vencidos",
        count: overdueControls,
        severity: overdueControls > 0 ? "high" : "low",
      },
      {
        key: "quarterly-controls-with-errors",
        label: "Controles con rechazos",
        count: controlsWithErrors,
        severity: controlsWithErrors > 0 ? "medium" : "low",
      },
      {
        key: "vehicles-without-recent-kilometers",
        label: "Sin registro de km reciente",
        count: vehiclesWithoutRecentKilometers,
        severity: vehiclesWithoutRecentKilometers > 0 ? "medium" : "low",
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

    // Get all vehicles (optionally filtered by search)
    const vehicleQb = this.vehicleRepo
      .createQueryBuilder("v")
      .select(["v.id", "v.licensePlate"]);

    if (search) {
      vehicleQb.where("v.licensePlate LIKE :search", {
        search: `%${search}%`,
      });
    }

    const allVehicles = await vehicleQb.getMany();

    // Get vehicles with active responsibles
    const vehiclesWithResponsible = await this.vehicleResponsibleRepo
      .createQueryBuilder("vr")
      .select("DISTINCT vr.vehicle_id", "vehicleId")
      .where("vr.start_date <= :today", { today })
      .andWhere("(vr.end_date IS NULL OR vr.end_date >= :today)", { today })
      .getRawMany();

    const vehicleIdsWithResponsible = new Set(
      vehiclesWithResponsible.map((v) => v.vehicleId),
    );

    // Filter vehicles without responsible
    const vehiclesWithout = allVehicles.filter(
      (v) => !vehicleIdsWithResponsible.has(v.id),
    );

    // Get last responsible end date for each vehicle without current responsible
    const allResults: VehicleWithoutResponsible[] = [];
    for (const vehicle of vehiclesWithout) {
      const lastResponsible = await this.vehicleResponsibleRepo
        .createQueryBuilder("vr")
        .select("vr.end_date", "endDate")
        .where("vr.vehicle_id = :vehicleId", { vehicleId: vehicle.id })
        .orderBy("vr.end_date", "DESC")
        .getRawOne();

      allResults.push({
        id: vehicle.id,
        vehicleId: vehicle.id,
        vehicleLicensePlate: vehicle.licensePlate,
        lastResponsibleEndDate: lastResponsible?.endDate || undefined,
      });
    }

    const total = allResults.length;
    const items = allResults.slice(offset, offset + limit);

    return { items, total };
  }

  async getVehiclesWithoutResponsibleCount(): Promise<number> {
    // Llamar sin paginación para obtener el count real
    const { total } = await this.getVehiclesWithoutResponsible({
      limit: 1,
      offset: 0,
    });
    return total;
  }

  /**
   * Get overdue quarterly controls (past intended date, not filled)
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

    // Query con subquery para contar ítems pendientes y totales
    // Un control está vencido si: fecha vencida Y (no enviado O tiene ítems pendientes)
    const queryBuilder = this.quarterlyControlRepo
      .createQueryBuilder("qc")
      .leftJoinAndSelect("qc.vehicle", "v")
      .leftJoinAndSelect("qc.items", "qci")
      .where("qc.intended_delivery_date < :toleranceDate", {
        toleranceDate: toleranceDateStr,
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
      queryBuilder.andWhere("v.licensePlate LIKE :search", {
        search: `%${search}%`,
      });
    }

    const controls = await queryBuilder
      .orderBy("qc.intended_delivery_date", "ASC")
      .getMany();

    // Filtrar: sin filledAt O con ítems pendientes
    const overdueControls = controls.filter((qc) => {
      const pendingCount = qc.items.filter(
        (item) => item.status === QuarterlyControlItemStatus.PENDIENTE,
      ).length;
      return qc.filledAt === null || pendingCount > 0;
    });

    const allItems = overdueControls.map((qc) => {
      const intendedDate = new Date(qc.intendedDeliveryDate);
      const daysOverdue = Math.floor(
        (today.getTime() - intendedDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const pendingItemsCount = qc.items.filter(
        (item) => item.status === QuarterlyControlItemStatus.PENDIENTE,
      ).length;

      return {
        id: qc.id,
        vehicleId: qc.vehicle.id,
        vehicleLicensePlate: qc.vehicle.licensePlate,
        year: qc.year,
        quarter: qc.quarter,
        intendedDeliveryDate: qc.intendedDeliveryDate,
        daysOverdue,
        pendingItemsCount,
        totalItemsCount: qc.items.length,
      };
    });

    const total = allItems.length;
    const items = allItems.slice(offset, offset + limit);

    return { items, total };
  }

  async getOverdueQuarterlyControlsCount(
    filters: OverdueQuarterlyControlsFilters,
  ): Promise<number> {
    // Reutilizamos la lógica de getOverdueQuarterlyControls para mantener consistencia
    const { total } = await this.getOverdueQuarterlyControls({
      ...filters,
      limit: 99999,
      offset: 0,
    });
    return total;
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
    const { total } = await this.getQuarterlyControlsWithErrors({
      ...filters,
      limit: 1,
      offset: 0,
    });
    return total;
  }

  async getOverdueMaintenanceCount(
    filters: OverdueMaintenanceFilters,
  ): Promise<number> {
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

    // Get all vehicles with their models and current km
    const vehicles = await this.vehicleRepo
      .createQueryBuilder("v")
      .leftJoinAndSelect("v.model", "model")
      .getMany();

    // Get current km for each vehicle
    const vehicleKms = await this.vehicleKilometersRepo
      .createQueryBuilder("vk")
      .select("vk.vehicle_id", "vehicleId")
      .addSelect("vk.kilometers", "kilometers")
      .where((qb) => {
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

    // Collect all overdue vehicles across all requirements
    const allOverdueVehicles: OverdueMaintenanceVehicleFlat[] = [];

    for (const req of requirements) {
      // Find vehicles for this model
      const vehiclesForModel = vehicles.filter(
        (v) => v.model?.id === req.model.id,
      );

      for (const vehicle of vehiclesForModel) {
        // Get last maintenance record for this vehicle and maintenance type
        const lastRecord = await this.maintenanceRecordRepo
          .createQueryBuilder("rec")
          .where("rec.vehicle_id = :vehicleId", { vehicleId: vehicle.id })
          .andWhere("rec.maintenance_id = :maintenanceId", {
            maintenanceId: req.maintenance.id,
          })
          .orderBy("rec.date", "DESC")
          .getOne();

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
          if (req.kilometersFrequency) {
            dueKilometers = lastRecord.kilometers + req.kilometersFrequency;
            if (currentKm > dueKilometers) {
              isOverdue = true;
              kilometersOverdue = currentKm - dueKilometers;
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

    // Subquery to get latest km date per vehicle
    const latestKmSubquery = this.vehicleKilometersRepo
      .createQueryBuilder("vk")
      .select("vk.vehicle_id", "vehicle_id")
      .addSelect("MAX(vk.date)", "last_date")
      .addSelect("MAX(vk.kilometers)", "last_km")
      .groupBy("vk.vehicle_id");

    const queryBuilder = this.vehicleRepo
      .createQueryBuilder("v")
      .leftJoin(
        `(${latestKmSubquery.getQuery()})`,
        "km",
        "km.vehicle_id = v.id",
      )
      .select("v.id", "id")
      .addSelect("v.licensePlate", "vehicleLicensePlate")
      .addSelect("km.last_date", "lastKilometerDate")
      .addSelect("km.last_km", "lastKilometers")
      .addSelect(
        `CASE 
          WHEN km.last_date IS NULL THEN -1 
          ELSE DATEDIFF(day, km.last_date, GETDATE()) 
        END`,
        "daysSinceLastUpdate",
      )
      .where(
        `(km.last_date IS NULL OR DATEDIFF(day, km.last_date, GETDATE()) > :days)`,
        { days: daysWithoutUpdate },
      );

    // Apply search filter
    if (search) {
      queryBuilder.andWhere("v.licensePlate LIKE :search", {
        search: `%${search}%`,
      });
    }

    const results = await queryBuilder.getRawMany();

    const allItems = results.map((r) => ({
      id: r.id,
      vehicleId: r.id,
      vehicleLicensePlate: r.vehicleLicensePlate,
      lastKilometerDate: r.lastKilometerDate
        ? new Date(r.lastKilometerDate).toISOString().split("T")[0]
        : undefined,
      lastKilometers: r.lastKilometers ?? undefined,
      daysSinceLastUpdate: r.daysSinceLastUpdate,
    }));

    const total = allItems.length;
    const items = allItems.slice(offset, offset + limit);

    return { items, total };
  }

  async getVehiclesWithoutRecentKilometersCount(
    filters: VehiclesWithoutRecentKilometersFilters,
  ): Promise<number> {
    const { total } = await this.getVehiclesWithoutRecentKilometers({
      ...filters,
      limit: 1,
      offset: 0,
    });
    return total;
  }
}
