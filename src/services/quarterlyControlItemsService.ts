import { QuarterlyControlItem } from "@/entities/QuarterlyControlItem";
import {
  IQuarterlyControlItemRepository,
  QuarterlyControlItemFilters,
} from "@/repositories/interfaces/IQuarterlyControlItemRepository";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import type { QuarterlyControlItemDTO } from "@/schemas/quarterlyControlItem";
import { QuarterlyControlsService } from "@/services/quarterlyControlsService";
import { QuarterlyControlItemStatus } from "@/enums/QuarterlyControlItemStatusEnum";

function map(qci: QuarterlyControlItem): QuarterlyControlItemDTO {
  return {
    id: qci.id,
    quarterlyControlId: qci.quarterlyControl.id,
    category: qci.category,
    title: qci.title,
    status: qci.status,
    observations: qci.observations,
  };
}

export class QuarterlyControlItemsService {
  constructor(
    private readonly repository: IQuarterlyControlItemRepository,
    private readonly controlService: QuarterlyControlsService,
  ) {}

  async getAll(
    options: RepositoryFindOptions<Partial<QuarterlyControlItemFilters>>,
  ): Promise<{ items: QuarterlyControlItemDTO[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount(options);
    const items = entities.map(map);
    return { items, total };
  }

  async getById(id: string): Promise<QuarterlyControlItemDTO | null> {
    const entity = await this.repository.findOne(id);
    return entity ? map(entity) : null;
  }

  async create(
    data: Partial<QuarterlyControlItem>,
  ): Promise<QuarterlyControlItemDTO> {
    const entity = this.repository.create(data);
    const saved = await this.repository.save(entity);
    return map(saved);
  }

  async createMany(
    controlId: string,
    items: {
      title: string;
      status: QuarterlyControlItemStatus;
      observations: string;
    }[],
  ): Promise<QuarterlyControlItemDTO[]> {
    const entities = this.repository.createMany(
      items.map((item) => ({
        quarterlyControlId: controlId,
        title: item.title,
        status: item.status,
        observations: item.observations,
      })),
    );
    const savedEntities = await this.repository.saveMany(entities);

    return savedEntities.map(map);
  }

  async fillControl(
    userId: string,
    controlId: string,
    items: {
      title: string;
      status: QuarterlyControlItemStatus;
      observations: string;
    }[],
  ): Promise<QuarterlyControlItemDTO[]> {
    // Check if control exists and is not filled
    const control = await this.controlService.getById(controlId);
    if (!control) {
      throw new Error("Control not found");
    }
    if (control.filledBy) {
      throw new Error("Control is already filled");
    }

    // Check if there are existing items
    const [, totalExisting] = await this.repository.findAndCount({
      filters: { quarterlyControlId: controlId },
    });
    if (totalExisting > 0) {
      throw new Error("Control already has items");
    }

    // Create items
    const createdItems = await this.createMany(controlId, items);

    // Update control
    await this.controlService.update(controlId, {
      filledBy: userId,
      filledAt: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    });

    return createdItems;
  }

  async update(
    id: string,
    data: Partial<QuarterlyControlItem>,
  ): Promise<QuarterlyControlItemDTO | null> {
    const existing = await this.repository.findOne(id);
    if (!existing) return null;

    Object.assign(existing, data);
    const saved = await this.repository.save(existing);
    return map(saved);
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
