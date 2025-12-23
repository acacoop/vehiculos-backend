import { QuarterlyControl } from "@/entities/QuarterlyControl";
import {
  IQuarterlyControlRepository,
  QuarterlyControlFilters,
} from "@/repositories/interfaces/IQuarterlyControlRepository";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import type {
  QuarterlyControlDTO,
  QuarterlyControl as QuarterlyControlSchema,
} from "@/schemas/quarterlyControl";
import { validateVehicleExists } from "@/utils/validation/entity";
import { User } from "@/entities/User";
import { Vehicle } from "@/entities/Vehicle";
import { VehicleKilometers } from "@/entities/VehicleKilometers";
import { Repository, DataSource } from "typeorm";
import { QuarterlyControlItemStatus } from "@/enums/QuarterlyControlItemStatusEnum";
import { QuarterlyControlItem } from "@/entities/QuarterlyControlItem";
import { VehicleKilometersService } from "@/services/vehicleKilometersService";

function map(qc: QuarterlyControl): QuarterlyControlDTO {
  return {
    id: qc.id,
    vehicle: {
      id: qc.vehicle.id,
      licensePlate: qc.vehicle.licensePlate,
      year: qc.vehicle.year,
      chassisNumber: qc.vehicle.chassisNumber ?? undefined,
      engineNumber: qc.vehicle.engineNumber ?? undefined,
      transmission: qc.vehicle.transmission ?? undefined,
      fuelType: qc.vehicle.fuelType ?? undefined,
      model: {
        id: qc.vehicle.model.id,
        name: qc.vehicle.model.name,
        vehicleType: qc.vehicle.model.vehicleType ?? undefined,
        brand: {
          id: qc.vehicle.model.brand.id,
          name: qc.vehicle.model.brand.name,
        },
      },
    },
    year: qc.year,
    quarter: qc.quarter,
    intendedDeliveryDate: qc.intendedDeliveryDate,
    filledBy: qc.filledBy
      ? {
          id: qc.filledBy.id,
          firstName: qc.filledBy.firstName,
          lastName: qc.filledBy.lastName,
          cuit: qc.filledBy.cuit,
          email: qc.filledBy.email,
          entraId: qc.filledBy.entraId,
          active: qc.filledBy.active,
        }
      : undefined,
    filledAt: qc.filledAt ?? undefined,
    kilometersLog: qc.kilometersLog
      ? {
          id: qc.kilometersLog.id,
          kilometers: qc.kilometersLog.kilometers,
          date: qc.kilometersLog.date,
        }
      : undefined,
    items: (qc.items || []).map((item) => ({
      id: item.id,
      category: item.category,
      title: item.title,
      status: item.status,
      observations: item.observations,
    })),
  };
}

export class QuarterlyControlsService {
  constructor(
    private readonly repository: IQuarterlyControlRepository,
    private readonly userRepo: Repository<User>,
    private readonly vehicleRepo: Repository<Vehicle>,
    private readonly dataSource: DataSource,
    private readonly vehicleKilometersService: VehicleKilometersService,
  ) {}

  async getAll(
    options: RepositoryFindOptions<Partial<QuarterlyControlFilters>>,
  ): Promise<{ items: QuarterlyControlDTO[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount(options);
    const items = entities.map(map);
    return { items, total };
  }

  async getById(id: string): Promise<QuarterlyControlDTO | null> {
    const entity = await this.repository.findOne(id);
    return entity ? map(entity) : null;
  }

  async create(data: QuarterlyControlSchema): Promise<QuarterlyControlDTO> {
    await validateVehicleExists(data.vehicleId);

    const vehicle = await this.vehicleRepo.findOne({
      where: { id: data.vehicleId },
    });
    if (!vehicle) throw new Error("Vehicle not found");

    const filledBy = data.filledBy
      ? await this.userRepo.findOne({ where: { id: data.filledBy } })
      : null;

    const entityData: Partial<QuarterlyControl> = {
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
    data: Partial<QuarterlyControlSchema>,
  ): Promise<QuarterlyControlDTO | null> {
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
      status: QuarterlyControlItemStatus;
      observations: string;
    }[];
  }): Promise<QuarterlyControlDTO> {
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
      // Create control
      const controlData: Partial<QuarterlyControl> = {
        vehicle,
        year: data.year,
        quarter: data.quarter,
        intendedDeliveryDate: data.intendedDeliveryDate,
      };

      const control = queryRunner.manager.create(QuarterlyControl, controlData);
      const savedControl = await queryRunner.manager.save(control);

      // Create items
      if (data.items && data.items.length > 0) {
        const items = data.items.map((item) =>
          queryRunner.manager.create(QuarterlyControlItem, {
            quarterlyControl: savedControl,
            title: item.title,
            status: item.status,
            observations: item.observations,
          }),
        );
        await queryRunner.manager.save(items);
      }

      await queryRunner.commitTransaction();

      // Fetch the complete entity with relations
      const complete = await this.repository.findOne(savedControl.id);
      if (!complete) throw new Error("Failed to fetch created control");

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
        status: QuarterlyControlItemStatus;
        observations: string;
      }[];
    },
    userId?: string,
  ): Promise<QuarterlyControlDTO | null> {
    const existing = await this.repository.findOne(id);
    if (!existing) return null;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update filledBy and filledAt
      if (userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (user) {
          existing.filledBy = user;
          existing.filledAt = new Date().toISOString();
          await queryRunner.manager.save(existing);
        }
      }

      // Validate that all items belong to this control
      for (const itemUpdate of data.items) {
        const item = await queryRunner.manager.findOne(QuarterlyControlItem, {
          where: { id: itemUpdate.id },
          relations: ["quarterlyControl"],
        });

        if (!item) {
          throw new Error(`Item with id ${itemUpdate.id} not found`);
        }

        if (item.quarterlyControl.id !== id) {
          throw new Error(
            `Item with id ${itemUpdate.id} does not belong to this control`,
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
        const item = await queryRunner.manager.findOne(QuarterlyControlItem, {
          where: { id: itemUpdate.id },
        });
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
