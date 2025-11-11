import { DataSource, Repository } from "typeorm";
import { VehicleKilometers } from "@/entities/VehicleKilometers";
import {
  IVehicleKilometersRepository,
  VehicleKilometersFilters,
} from "@/repositories/interfaces/IVehicleKilometersRepository";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";

export class VehicleKilometersRepository
  implements IVehicleKilometersRepository
{
  private readonly repo: Repository<VehicleKilometers>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(VehicleKilometers);
  }

  async findAll(
    options: RepositoryFindOptions<Partial<VehicleKilometersFilters>>,
  ): Promise<{ items: VehicleKilometers[]; total: number }> {
    const qb = this.qb();

    // Apply filters
    if (options.filters?.vehicleId) {
      qb.andWhere("vehicle.id = :vehicleId", {
        vehicleId: options.filters.vehicleId,
      });
    }
    if (options.filters?.userId) {
      qb.andWhere("vk.user.id = :userId", { userId: options.filters.userId });
    }
    if (options.filters?.startDate) {
      qb.andWhere("vk.date >= :startDate", {
        startDate: options.filters.startDate,
      });
    }
    if (options.filters?.endDate) {
      qb.andWhere("vk.date <= :endDate", { endDate: options.filters.endDate });
    }

    // Apply search
    if (options.search) {
      qb.andWhere(
        "(vehicle.licensePlate LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search)",
        { search: `%${options.search}%` },
      );
    }

    // Get total count
    const total = await qb.getCount();

    // Apply pagination
    if (options.pagination) {
      qb.skip(options.pagination.offset).take(options.pagination.limit);
    }

    // Order by date descending (most recent first)
    qb.orderBy("vk.date", "DESC");

    const items = await qb.getMany();

    return { items, total };
  }

  async findById(id: string): Promise<VehicleKilometers | null> {
    return this.repo.findOne({
      where: { id },
      relations: ["vehicle", "vehicle.model", "vehicle.model.brand", "user"],
    });
  }

  findByVehicle(vehicleId: string) {
    return this.repo.find({
      where: { vehicle: { id: vehicleId } },
      order: { date: "ASC" },
    });
  }

  qb() {
    return this.repo
      .createQueryBuilder("vk")
      .leftJoinAndSelect("vk.vehicle", "vehicle")
      .leftJoinAndSelect("vehicle.model", "model")
      .leftJoinAndSelect("model.brand", "brand")
      .leftJoinAndSelect("vk.user", "user");
  }

  findPrev(vehicleId: string, date: Date) {
    return this.qb()
      .where("vehicle.id = :vehicleId", { vehicleId })
      .andWhere("vk.date < :date", { date })
      .orderBy("vk.date", "DESC")
      .getOne();
  }

  findNext(vehicleId: string, date: Date) {
    return this.qb()
      .where("vehicle.id = :vehicleId", { vehicleId })
      .andWhere("vk.date > :date", { date })
      .orderBy("vk.date", "ASC")
      .getOne();
  }

  create(data: Partial<VehicleKilometers>) {
    return this.repo.create(data);
  }

  save(ent: VehicleKilometers) {
    return this.repo.save(ent);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
