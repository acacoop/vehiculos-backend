import { DataSource, Repository } from "typeorm";
import { MaintenanceCategory } from "../entities/MaintenanceCategory";
import { IMaintenanceCategoryRepository } from "./interfaces/IMaintenanceCategoryRepository";

export class MaintenanceCategoryRepository
  implements IMaintenanceCategoryRepository
{
  private readonly repo: Repository<MaintenanceCategory>;
  constructor(ds: DataSource) {
    this.repo = ds.getRepository(MaintenanceCategory);
  }
  findAll() {
    return this.repo.find({ order: { name: "ASC" } });
  }
  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }
  create(data: Partial<MaintenanceCategory>) {
    return this.repo.create(data);
  }
  save(entity: MaintenanceCategory) {
    return this.repo.save(entity);
  }
  delete(id: string) {
    return this.repo.delete(id);
  }
}
