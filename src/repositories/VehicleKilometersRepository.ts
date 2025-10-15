import { DataSource, Repository } from "typeorm";
import { VehicleKilometers } from "../entities/VehicleKilometers";
import { IVehicleKilometersRepository } from "./interfaces/IVehicleKilometersRepository";

export class VehicleKilometersRepository
  implements IVehicleKilometersRepository
{
  private readonly repo: Repository<VehicleKilometers>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(VehicleKilometers);
  }
  findByVehicle(vehicleId: string) {
    return this.repo.find({
      where: { vehicle: { id: vehicleId } },
      order: { date: "ASC" },
    });
  }
  qb() {
    return this.repo.createQueryBuilder("vk").leftJoin("vk.vehicle", "vehicle");
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
}
