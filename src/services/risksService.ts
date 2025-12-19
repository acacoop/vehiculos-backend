import { RisksRepository } from "@/repositories/RisksRepository";
import {
  RisksSummary,
  VehicleWithoutResponsible,
  OverdueQuarterlyControl,
  QuarterlyControlWithErrors,
  OverdueMaintenanceRequirement,
  OverdueMaintenanceVehicleFlat,
  VehicleWithoutRecentKilometers,
  RisksSummaryFilters,
  VehiclesWithoutResponsibleFilters,
  OverdueMaintenanceFilters,
  OverdueQuarterlyControlsFilters,
  QuarterlyControlsWithErrorsFilters,
  VehiclesWithoutRecentKilometersFilters,
} from "@/schemas/risks";

interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export class RisksService {
  constructor(private readonly risksRepo: RisksRepository) {}

  async getSummary(filters: RisksSummaryFilters): Promise<RisksSummary[]> {
    return this.risksRepo.getRisksSummary(filters);
  }

  async getVehiclesWithoutResponsible(
    filters: VehiclesWithoutResponsibleFilters,
  ): Promise<PaginatedResult<VehicleWithoutResponsible>> {
    return this.risksRepo.getVehiclesWithoutResponsible(filters);
  }

  async getOverdueMaintenance(
    filters: OverdueMaintenanceFilters,
  ): Promise<PaginatedResult<OverdueMaintenanceRequirement>> {
    return this.risksRepo.getOverdueMaintenance(filters);
  }

  async getOverdueMaintenanceVehicles(
    filters: OverdueMaintenanceFilters,
  ): Promise<PaginatedResult<OverdueMaintenanceVehicleFlat>> {
    return this.risksRepo.getOverdueMaintenanceVehicles(filters);
  }

  async getOverdueQuarterlyControls(
    filters: OverdueQuarterlyControlsFilters,
  ): Promise<PaginatedResult<OverdueQuarterlyControl>> {
    return this.risksRepo.getOverdueQuarterlyControls(filters);
  }

  async getQuarterlyControlsWithErrors(
    filters: QuarterlyControlsWithErrorsFilters,
  ): Promise<PaginatedResult<QuarterlyControlWithErrors>> {
    return this.risksRepo.getQuarterlyControlsWithErrors(filters);
  }

  async getVehiclesWithoutRecentKilometers(
    filters: VehiclesWithoutRecentKilometersFilters,
  ): Promise<PaginatedResult<VehicleWithoutRecentKilometers>> {
    return this.risksRepo.getVehiclesWithoutRecentKilometers(filters);
  }
}
