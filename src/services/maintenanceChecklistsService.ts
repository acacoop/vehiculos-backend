import { MaintenanceChecklist } from "@/entities/MaintenanceChecklist";
import {
  IMaintenanceChecklistRepository,
  MaintenanceChecklistFilters,
} from "@/repositories/interfaces/IMaintenanceChecklistRepository";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import type {
  MaintenanceChecklistDTO,
  MaintenanceChecklist as MaintenanceChecklistSchema,
} from "@/schemas/maintenanceChecklist";
import { validateVehicleExists } from "@/utils/validation/entity";
import { User } from "@/entities/User";
import { Vehicle } from "@/entities/Vehicle";
import { VehicleKilometers } from "@/entities/VehicleKilometers";
import { Repository, DataSource } from "typeorm";
import { MaintenanceChecklistItemStatus } from "@/enums/MaintenanceChecklistItemStatusEnum";
import { MaintenanceChecklistItem } from "@/entities/MaintenanceChecklistItem";
import { VehicleKilometersService } from "@/services/vehicleKilometersService";

function map(mc: MaintenanceChecklist): MaintenanceChecklistDTO {
  return {
    id: mc.id,
    vehicle: {
      id: mc.vehicle.id,
      licensePlate: mc.vehicle.licensePlate,
      year: mc.vehicle.year,
      chassisNumber: mc.vehicle.chassisNumber ?? undefined,
      engineNumber: mc.vehicle.engineNumber ?? undefined,
      transmission: mc.vehicle.transmission ?? undefined,
      fuelType: mc.vehicle.fuelType ?? undefined,
      model: {
        id: mc.vehicle.model.id,
        name: mc.vehicle.model.name,
        vehicleType: mc.vehicle.model.vehicleType ?? undefined,
        brand: {
          id: mc.vehicle.model.brand.id,
          name: mc.vehicle.model.brand.name,
        },
      },
    },
    year: mc.year,
    quarter: mc.quarter,
    intendedDeliveryDate: mc.intendedDeliveryDate,
    filledBy: mc.filledBy
      ? {
          id: mc.filledBy.id,
          firstName: mc.filledBy.firstName,
          lastName: mc.filledBy.lastName,
          cuit: mc.filledBy.cuit,
          email: mc.filledBy.email,
          entraId: mc.filledBy.entraId,
          active: mc.filledBy.active,
        }
      : undefined,
    filledAt: mc.filledAt ?? undefined,
    kilometersLog: mc.kilometersLog
      ? {
          id: mc.kilometersLog.id,
          kilometers: mc.kilometersLog.kilometers,
          date: mc.kilometersLog.date,
        }
      : undefined,
    items: (mc.items || []).map((item) => ({
      id: item.id,
      category: item.category,
      title: item.title,
      status: item.status,
      observations: item.observations,
    })),
  };
}

export class MaintenanceChecklistsService {
  constructor(
    private readonly repository: IMaintenanceChecklistRepository,
    private readonly userRepo: Repository<User>,
    private readonly vehicleRepo: Repository<Vehicle>,
    private readonly dataSource: DataSource,
    private readonly vehicleKilometersService: VehicleKilometersService,
  ) {}

  async getAll(
    options: RepositoryFindOptions<Partial<MaintenanceChecklistFilters>>,
  ): Promise<{ items: MaintenanceChecklistDTO[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount(options);
    const items = entities.map(map);
    return { items, total };
  }

  async getById(id: string): Promise<MaintenanceChecklistDTO | null> {
    const entity = await this.repository.findOne(id);
    return entity ? map(entity) : null;
  }

  async create(
    data: MaintenanceChecklistSchema,
  ): Promise<MaintenanceChecklistDTO> {
    await validateVehicleExists(data.vehicleId);

    const vehicle = await this.vehicleRepo.findOne({
      where: { id: data.vehicleId },
    });
    if (!vehicle) throw new Error("Vehicle not found");

    const filledBy = data.filledBy
      ? await this.userRepo.findOne({ where: { id: data.filledBy } })
      : null;

    const entityData: Partial<MaintenanceChecklist> = {
      vehicle,
      year: data.year,
      quarter: data.quarter,
      intendedDeliveryDate: data.intendedDeliveryDate,
      filledBy,
      filledAt: data.filledAt,
    };

    const entity = this.repository.create(entityData);
    const saved = await this.repository.save(entity);
    return map(saved);
  }

  async update(
    id: string,
    data: Partial<MaintenanceChecklistSchema>,
  ): Promise<MaintenanceChecklistDTO | null> {
    const existing = await this.repository.findOne(id);
    if (!existing) return null;

    if (data.vehicleId) {
      await validateVehicleExists(data.vehicleId);
      const vehicle = await this.vehicleRepo.findOne({
        where: { id: data.vehicleId },
      });
      if (!vehicle) throw new Error("Vehicle not found");
      existing.vehicle = vehicle;
    }

    if (data.year !== undefined) existing.year = data.year;
    if (data.quarter !== undefined) existing.quarter = data.quarter;
    if (data.intendedDeliveryDate)
      existing.intendedDeliveryDate = data.intendedDeliveryDate;

    if (data.filledBy !== undefined) {
      existing.filledBy = data.filledBy
        ? (await this.userRepo.findOne({ where: { id: data.filledBy } })) ||
          null
        : null;
    }

    if (data.filledAt !== undefined) existing.filledAt = data.filledAt;

    const saved = await this.repository.save(existing);
    return map(saved);
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }

  async createWithItems(data: {
    vehicleId: string;
    year: number;
    quarter: number;
    intendedDeliveryDate: string;
    items: {
      title: string;
      status: MaintenanceChecklistItemStatus;
      observations: string;
    }[];
  }): Promise<MaintenanceChecklistDTO> {
    await validateVehicleExists(data.vehicleId);

    const vehicle = await this.vehicleRepo.findOne({
      where: { id: data.vehicleId },
      relations: ["model", "model.brand"],
    });
    if (!vehicle) throw new Error("Vehicle not found");

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create checklist
      const checklistData: Partial<MaintenanceChecklist> = {
        vehicle,
        year: data.year,
        quarter: data.quarter,
        intendedDeliveryDate: data.intendedDeliveryDate,
      };

      const checklist = queryRunner.manager.create(
        MaintenanceChecklist,
        checklistData,
      );
      const savedChecklist = await queryRunner.manager.save(checklist);

      // Create items
      if (data.items && data.items.length > 0) {
        const items = data.items.map((item) =>
          queryRunner.manager.create(MaintenanceChecklistItem, {
            maintenanceChecklist: savedChecklist,
            title: item.title,
            status: item.status,
            observations: item.observations,
          }),
        );
        await queryRunner.manager.save(items);
      }

      await queryRunner.commitTransaction();

      // Fetch the complete entity with relations
      const complete = await this.repository.findOne(savedChecklist.id);
      if (!complete) throw new Error("Failed to fetch created checklist");

      return map(complete);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async patchWithItems(
    id: string,
    data: {
      userId: string;
      kilometers: number;
      items: {
        id: string;
        status: MaintenanceChecklistItemStatus;
        observations: string;
      }[];
    },
  ): Promise<MaintenanceChecklistDTO | null> {
    const existing = await this.repository.findOne(id);
    if (!existing) return null;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate that all items belong to this checklist
      for (const itemUpdate of data.items) {
        const item = await queryRunner.manager.findOne(
          MaintenanceChecklistItem,
          {
            where: { id: itemUpdate.id },
            relations: ["maintenanceChecklist"],
          },
        );

        if (!item) {
          throw new Error(`Item with id ${itemUpdate.id} not found`);
        }

        if (item.maintenanceChecklist.id !== id) {
          throw new Error(
            `Item with id ${itemUpdate.id} does not belong to this checklist`,
          );
        }
      }

      // Create kilometer log inside transaction
      const user = await queryRunner.manager.findOne(User, {
        where: { id: data.userId },
      });
      if (!user) throw new Error("User not found");

      const vehicle = await queryRunner.manager.findOne(Vehicle, {
        where: { id: existing.vehicle.id },
        relations: ["model", "model.brand"],
      });
      if (!vehicle) throw new Error("Vehicle not found");

      const kilometersLogEntity = queryRunner.manager.create(
        VehicleKilometers,
        {
          vehicle,
          user,
          date: new Date(),
          kilometers: data.kilometers,
        },
      );
      const savedKilometersLog = await queryRunner.manager.save(
        VehicleKilometers,
        kilometersLogEntity,
      );

      // Update checklist with kilometer log reference
      existing.kilometersLog = savedKilometersLog;
      await queryRunner.manager.save(existing);

      // Update items
      for (const itemUpdate of data.items) {
        const item = await queryRunner.manager.findOne(
          MaintenanceChecklistItem,
          { where: { id: itemUpdate.id } },
        );
        if (item) {
          item.status = itemUpdate.status;
          item.observations = itemUpdate.observations;
          await queryRunner.manager.save(item);
        }
      }

      await queryRunner.commitTransaction();

      // Fetch the complete entity with relations
      const complete = await this.repository.findOne(id);
      if (!complete) return null;

      return map(complete);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
