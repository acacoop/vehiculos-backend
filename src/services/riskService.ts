import { RiskRepository } from "@/repositories/RiskRepository";
import {
  RiskSummary,
  VehicleWithoutResponsible,
  OverdueQuarterlyControl,
  QuarterlyControlWithErrors,
  OverdueMaintenanceItem,
} from "@/schemas/risk";

export class RiskService {
  constructor(private readonly riskRepo: RiskRepository) {}

  async getSummary(): Promise<RiskSummary[]> {
    return this.riskRepo.getRiskSummary();
  }

  async getVehiclesWithoutResponsible(): Promise<VehicleWithoutResponsible[]> {
    return this.riskRepo.getVehiclesWithoutResponsible();
  }

  async getOverdueMaintenance(): Promise<OverdueMaintenanceItem[]> {
    return this.riskRepo.getOverdueMaintenance();
  }

  async getOverdueQuarterlyControls(): Promise<OverdueQuarterlyControl[]> {
    return this.riskRepo.getOverdueQuarterlyControls();
  }

  async getQuarterlyControlsWithErrors(): Promise<
    QuarterlyControlWithErrors[]
  > {
    return this.riskRepo.getQuarterlyControlsWithErrors();
  }
}
