import { DataSource, Repository, IsNull, LessThan } from "typeorm";
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
  OverdueMaintenanceItem,
  RiskSummary,
} from "@/schemas/risk";

export class RiskRepository {
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
  async getRiskSummary(): Promise<RiskSummary[]> {
    const [
      vehiclesWithoutResponsible,
      overdueControls,
      controlsWithErrors,
      overdueMaintenance,
    ] = await Promise.all([
      this.getVehiclesWithoutResponsibleCount(),
      this.getOverdueQuarterlyControlsCount(),
      this.getQuarterlyControlsWithErrorsCount(),
      this.getOverdueMaintenanceCount(),
    ]);

    return [
      {
        category: "Vehículos sin responsable",
        count: vehiclesWithoutResponsible,
        severity: vehiclesWithoutResponsible > 0 ? "high" : "low",
      },
      {
        category: "Mantenimientos vencidos",
        count: overdueMaintenance,
        severity: overdueMaintenance > 0 ? "high" : "low",
      },
      {
        category: "Controles trimestrales vencidos",
        count: overdueControls,
        severity: overdueControls > 0 ? "high" : "low",
      },
      {
        category: "Controles trimestrales con rechazos",
        count: controlsWithErrors,
        severity: controlsWithErrors > 0 ? "medium" : "low",
      },
    ];
  }

  /**
   * Get vehicles without current responsible
   */
  async getVehiclesWithoutResponsible(): Promise<VehicleWithoutResponsible[]> {
    const today = new Date().toISOString().split("T")[0];

    // Get all vehicles
    const allVehicles = await this.vehicleRepo.find({
      select: ["id", "licensePlate"],
    });

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
    const result: VehicleWithoutResponsible[] = [];
    for (const vehicle of vehiclesWithout) {
      const lastResponsible = await this.vehicleResponsibleRepo
        .createQueryBuilder("vr")
        .select("vr.end_date", "endDate")
        .where("vr.vehicle_id = :vehicleId", { vehicleId: vehicle.id })
        .orderBy("vr.end_date", "DESC")
        .getRawOne();

      result.push({
        vehicleId: vehicle.id,
        vehicleLicensePlate: vehicle.licensePlate,
        lastResponsibleEndDate: lastResponsible?.endDate || undefined,
      });
    }

    return result;
  }

  async getVehiclesWithoutResponsibleCount(): Promise<number> {
    const vehicles = await this.getVehiclesWithoutResponsible();
    return vehicles.length;
  }

  /**
   * Get overdue quarterly controls (past intended date, not filled)
   */
  async getOverdueQuarterlyControls(): Promise<OverdueQuarterlyControl[]> {
    const today = new Date().toISOString().split("T")[0];

    const overdueControls = await this.quarterlyControlRepo
      .createQueryBuilder("qc")
      .leftJoinAndSelect("qc.vehicle", "v")
      .where("qc.intended_delivery_date < :today", { today })
      .andWhere("qc.filled_at IS NULL")
      .orderBy("qc.intended_delivery_date", "ASC")
      .getMany();

    return overdueControls.map((qc) => {
      const intendedDate = new Date(qc.intendedDeliveryDate);
      const now = new Date();
      const daysOverdue = Math.floor(
        (now.getTime() - intendedDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        id: qc.id,
        vehicleId: qc.vehicle.id,
        vehicleLicensePlate: qc.vehicle.licensePlate,
        year: qc.year,
        quarter: qc.quarter,
        intendedDeliveryDate: qc.intendedDeliveryDate,
        daysOverdue,
      };
    });
  }

  async getOverdueQuarterlyControlsCount(): Promise<number> {
    const today = new Date().toISOString().split("T")[0];

    return this.quarterlyControlRepo.count({
      where: {
        intendedDeliveryDate: LessThan(today),
        filledAt: IsNull(),
      },
    });
  }

  /**
   * Get quarterly controls with rejected items
   */
  async getQuarterlyControlsWithErrors(): Promise<
    QuarterlyControlWithErrors[]
  > {
    const result = await this.quarterlyControlItemRepo
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
      })
      .groupBy("qc.id")
      .addGroupBy("v.id")
      .addGroupBy("v.license_plate")
      .addGroupBy("qc.year")
      .addGroupBy("qc.quarter")
      .orderBy("qc.year", "DESC")
      .addOrderBy("qc.quarter", "DESC")
      .getRawMany();

    return result.map((row) => ({
      id: row.id,
      vehicleId: row.vehicleId,
      vehicleLicensePlate: row.vehicleLicensePlate,
      year: row.year,
      quarter: row.quarter,
      rejectedItemsCount: parseInt(row.rejectedItemsCount),
    }));
  }

  async getQuarterlyControlsWithErrorsCount(): Promise<number> {
    const result = await this.quarterlyControlItemRepo
      .createQueryBuilder("qci")
      .select("COUNT(DISTINCT qci.quarterly_control_id)", "count")
      .where("qci.status = :status", {
        status: QuarterlyControlItemStatus.RECHAZADO,
      })
      .getRawOne();

    return parseInt(result?.count || "0");
  }

  /**
   * Get overdue maintenance items
   * Compares last maintenance record vs requirement frequency (by km or days)
   */
  async getOverdueMaintenance(): Promise<OverdueMaintenanceItem[]> {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Get all active requirements with their maintenance info
    const requirements = await this.maintenanceRequirementRepo
      .createQueryBuilder("mr")
      .leftJoinAndSelect("mr.maintenance", "m")
      .leftJoinAndSelect("mr.model", "model")
      .where("mr.start_date <= :today", { today: todayStr })
      .andWhere("(mr.end_date IS NULL OR mr.end_date >= :today)", {
        today: todayStr,
      })
      .getMany();

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

    const overdueItems: OverdueMaintenanceItem[] = [];

    for (const vehicle of vehicles) {
      if (!vehicle.model) continue;

      // Find requirements for this vehicle's model
      const vehicleRequirements = requirements.filter(
        (r) => r.model.id === vehicle.model.id,
      );

      for (const req of vehicleRequirements) {
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

            if (today > nextDueDate) {
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
          // No record at all - considered overdue if requirement exists
          isOverdue = true;
          daysOverdue = undefined;
          kilometersOverdue = undefined;
        }

        if (isOverdue) {
          overdueItems.push({
            vehicleId: vehicle.id,
            vehicleLicensePlate: vehicle.licensePlate,
            maintenanceId: req.maintenance.id,
            maintenanceName: req.maintenance.name,
            dueDate,
            dueKilometers,
            currentKilometers: currentKm,
            daysOverdue,
            kilometersOverdue,
          });
        }
      }
    }

    return overdueItems;
  }

  async getOverdueMaintenanceCount(): Promise<number> {
    const items = await this.getOverdueMaintenance();
    return items.length;
  }
}
