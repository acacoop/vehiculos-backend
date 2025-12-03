import { QuarterlyControl } from "@/entities/QuarterlyControl";
import { SelectQueryBuilder } from "typeorm";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";

export interface QuarterlyControlFilters {
  vehicleId?: string;
  year?: number;
  quarter?: number;
  filledBy?: string;
  hasFailedItems?: boolean;
}

export interface IQuarterlyControlRepository {
  qb(): SelectQueryBuilder<QuarterlyControl>;
  findAndCount(
    options?: RepositoryFindOptions<QuarterlyControlFilters>,
  ): Promise<[QuarterlyControl[], number]>;
  findOne(id: string): Promise<QuarterlyControl | null>;
  create(data: Partial<QuarterlyControl>): QuarterlyControl;
  save(entity: QuarterlyControl): Promise<QuarterlyControl>;
  delete(id: string): Promise<boolean>;
}
