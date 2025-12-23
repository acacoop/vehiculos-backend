import { QuarterlyControlItem } from "@/entities/QuarterlyControlItem";
import { SelectQueryBuilder } from "typeorm";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import { QuarterlyControlItemStatus } from "@/enums/QuarterlyControlItemStatusEnum";

export interface QuarterlyControlItemFilters {
  quarterlyControlId?: string;
  status?: QuarterlyControlItemStatus;
}

export interface IQuarterlyControlItemRepository {
  qb(): SelectQueryBuilder<QuarterlyControlItem>;
  findAndCount(
    options?: RepositoryFindOptions<QuarterlyControlItemFilters>,
  ): Promise<[QuarterlyControlItem[], number]>;
  findOne(id: string): Promise<QuarterlyControlItem | null>;
  create(data: Partial<QuarterlyControlItem>): QuarterlyControlItem;
  save(entity: QuarterlyControlItem): Promise<QuarterlyControlItem>;
  delete(id: string): Promise<boolean>;
  createMany(data: Partial<QuarterlyControlItem>[]): QuarterlyControlItem[];
  saveMany(entities: QuarterlyControlItem[]): Promise<QuarterlyControlItem[]>;
}
