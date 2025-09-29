import { DataSource, Repository } from "typeorm";
import { Role } from "../entities/Roles";

export interface RolesSearchParams {
  permission?: string;
}

export class RolesRepository {
  private readonly repo: Repository<Role>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(Role);
  }

  async findAndCount(options?: {
    limit?: number;
    offset?: number;
    searchParams?: RolesSearchParams;
  }): Promise<[Role[], number]> {
    const where: Record<string, unknown> = {};
    if (options?.searchParams?.permission) {
      where.permission = options.searchParams.permission;
    }

    return this.repo.findAndCount({
      where,
      take: options?.limit,
      skip: options?.offset,
      order: { permission: "ASC" },
      relations: ["cecoRanges"],
    });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id }, relations: ["cecoRanges"] });
  }

  create(data: Partial<Role>) {
    return this.repo.create(data);
  }

  save(entity: Role) {
    return this.repo.save(entity);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
