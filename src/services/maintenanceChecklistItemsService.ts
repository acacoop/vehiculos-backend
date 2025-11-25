import { MaintenanceChecklistItem } from "@/entities/MaintenanceChecklistItem";
import {
  IMaintenanceChecklistItemRepository,
  MaintenanceChecklistItemFilters,
} from "@/repositories/interfaces/IMaintenanceChecklistItemRepository";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";
import type { MaintenanceChecklistItemDTO } from "@/schemas/maintenanceChecklistItem";
import { MaintenanceChecklistsService } from "@/services/maintenanceChecklistsService";
import { MaintenanceChecklistItemStatus } from "@/enums/MaintenanceChecklistItemStatusEnum";

function map(mci: MaintenanceChecklistItem): MaintenanceChecklistItemDTO {
  return {
    id: mci.id,
    maintenanceChecklistId: mci.maintenanceChecklist.id,
    title: mci.title,
    status: mci.status,
    observations: mci.observations,
  };
}

export class MaintenanceChecklistItemsService {
  constructor(
    private readonly repository: IMaintenanceChecklistItemRepository,
    private readonly checklistService: MaintenanceChecklistsService,
  ) {}

  async getAll(
    options: RepositoryFindOptions<Partial<MaintenanceChecklistItemFilters>>,
  ): Promise<{ items: MaintenanceChecklistItemDTO[]; total: number }> {
    const [entities, total] = await this.repository.findAndCount(options);
    const items = entities.map(map);
    return { items, total };
  }

  async getById(id: string): Promise<MaintenanceChecklistItemDTO | null> {
    const entity = await this.repository.findOne(id);
    return entity ? map(entity) : null;
  }

  async create(
    data: Partial<MaintenanceChecklistItem>,
  ): Promise<MaintenanceChecklistItemDTO> {
    const entity = this.repository.create(data);
    const saved = await this.repository.save(entity);
    return map(saved);
  }

  async createMany(
    checklistId: string,
    items: {
      title: string;
      status: MaintenanceChecklistItemStatus;
      observations: string;
    }[],
  ): Promise<MaintenanceChecklistItemDTO[]> {
    const entities = this.repository.createMany(
      items.map((item) => ({
        maintenanceChecklistId: checklistId,
        title: item.title,
        status: item.status,
        observations: item.observations,
      })),
    );
    const savedEntities = await this.repository.saveMany(entities);

    return savedEntities.map(map);
  }

  async fillChecklist(
    userId: string,
    checklistId: string,
    items: {
      title: string;
      status: MaintenanceChecklistItemStatus;
      observations: string;
    }[],
  ): Promise<MaintenanceChecklistItemDTO[]> {
    // Check if checklist exists and is not filled
    const checklist = await this.checklistService.getById(checklistId);
    if (!checklist) {
      throw new Error("Checklist not found");
    }
    if (checklist.filledBy) {
      throw new Error("Checklist is already filled");
    }

    // Check if there are existing items
    const [, totalExisting] = await this.repository.findAndCount({
      filters: { maintenanceChecklistId: checklistId },
    });
    if (totalExisting > 0) {
      throw new Error("Checklist already has items");
    }

    // Create items
    const createdItems = await this.createMany(checklistId, items);

    // Update checklist
    await this.checklistService.update(checklistId, {
      filledBy: userId,
      filledAt: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    });

    return createdItems;
  }

  async update(
    id: string,
    data: Partial<MaintenanceChecklistItem>,
  ): Promise<MaintenanceChecklistItemDTO | null> {
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
