import { DataSource } from "typeorm";
import { UsersService } from "../services/usersService";
import { UserRepository } from "../repositories/UserRepository";
import { VehicleBrandService } from "../services/vehicleBrandService";
import { VehicleBrandRepository } from "../repositories/VehicleBrandRepository";
import { VehicleModelService } from "../services/vehicleModelService";
import { VehicleModelRepository } from "../repositories/VehicleModelRepository";
import { RolesService } from "../services/rolesService";
import { RolesRepository } from "../repositories/RolesRepository";
import { MaintenanceCategoriesService } from "../services/maintenanceCategoriesService";
import { MaintenanceCategoryRepository } from "../repositories/MaintenanceCategoryRepository";
import { ReservationsService } from "../services/reservationsService";
import { ReservationRepository } from "../repositories/ReservationRepository";
import { User } from "../entities/User";
import { Vehicle } from "../entities/Vehicle";
import { AssignmentsService } from "../services/assignmentsService";
import { AssignmentRepository } from "../repositories/AssignmentRepository";
import { VehicleResponsiblesService } from "../services/vehicleResponsiblesService";
import { VehicleResponsibleRepository } from "../repositories/VehicleResponsibleRepository";
import { VehicleResponsible } from "../entities/VehicleResponsible";
import {
  MaintenancesService,
  AssignedMaintenancesService,
  MaintenanceRecordsService,
} from "../services/maintenancesService";
import {
  MaintenanceRepository,
  AssignedMaintenanceRepository,
} from "../repositories/MaintenanceRepository";
import { MaintenanceRecordRepository } from "../repositories/MaintenanceRecordRepository";
import { MaintenanceRecord } from "../entities/MaintenanceRecord";
import { MaintenanceCategory } from "../entities/MaintenanceCategory";
import { Maintenance } from "../entities/Maintenance";
import { AssignedMaintenance } from "../entities/AssignedMaintenance";
import { VehicleRepository } from "../repositories/VehicleRepository";
import { VehicleModel } from "../entities/VehicleModel";
import { VehiclesService } from "../services/vehiclesService";

/**
 * Service Factory - Centralizes creation of service instances
 * This makes it easy to wire up dependencies and swap implementations for testing
 */
export class ServiceFactory {
  constructor(private readonly dataSource: DataSource) {}

  createUsersService(): UsersService {
    const userRepository = new UserRepository(this.dataSource);
    return new UsersService(userRepository);
  }

  createVehicleBrandService(): VehicleBrandService {
    const vehicleBrandRepository = new VehicleBrandRepository(this.dataSource);
    return new VehicleBrandService(vehicleBrandRepository);
  }

  createVehicleModelService(): VehicleModelService {
    const vehicleModelRepository = new VehicleModelRepository(this.dataSource);
    const vehicleBrandRepository = new VehicleBrandRepository(this.dataSource);
    return new VehicleModelService(
      vehicleModelRepository,
      vehicleBrandRepository,
    );
  }

  createRolesService(): RolesService {
    const rolesRepository = new RolesRepository(this.dataSource);
    return new RolesService(rolesRepository);
  }

  createMaintenanceCategoriesService(): MaintenanceCategoriesService {
    const repo = new MaintenanceCategoryRepository(this.dataSource);
    return new MaintenanceCategoriesService(repo);
  }

  createReservationsService(): ReservationsService {
    const reservationRepo = new ReservationRepository(this.dataSource);
    const userRepo = this.dataSource.getRepository(User);
    const vehicleRepo = this.dataSource.getRepository(Vehicle);
    return new ReservationsService(reservationRepo, userRepo, vehicleRepo);
  }

  createAssignmentsService(): AssignmentsService {
    const assignmentRepo = new AssignmentRepository(this.dataSource);
    const userRepo = this.dataSource.getRepository(User);
    const vehicleRepo = this.dataSource.getRepository(Vehicle);
    return new AssignmentsService(assignmentRepo, userRepo, vehicleRepo);
  }

  createVehicleResponsiblesService(): VehicleResponsiblesService {
    const vehicleResponsibleRepo = new VehicleResponsibleRepository(
      this.dataSource,
    );
    const vehicleRepo = this.dataSource.getRepository(Vehicle);
    const userRepo = this.dataSource.getRepository(User);
    const vehicleResponsibleEntityRepo =
      this.dataSource.getRepository(VehicleResponsible);
    return new VehicleResponsiblesService(
      vehicleResponsibleRepo,
      vehicleRepo,
      userRepo,
      vehicleResponsibleEntityRepo,
    );
  }

  createMaintenancesService(): MaintenancesService {
    const maintenanceRepo = new MaintenanceRepository(this.dataSource);
    const assignedRepo = new AssignedMaintenanceRepository(this.dataSource);
    const maintenanceCategoryRepo =
      this.dataSource.getRepository(MaintenanceCategory);
    return new MaintenancesService(
      maintenanceRepo,
      assignedRepo,
      maintenanceCategoryRepo,
    );
  }

  createAssignedMaintenancesService(): AssignedMaintenancesService {
    const assignedRepo = new AssignedMaintenanceRepository(this.dataSource);
    const vehicleRepo = this.dataSource.getRepository(Vehicle);
    const maintenanceRepo = this.dataSource.getRepository(Maintenance);
    return new AssignedMaintenancesService(
      assignedRepo,
      vehicleRepo,
      maintenanceRepo,
    );
  }

  createMaintenanceRecordsService(): MaintenanceRecordsService {
    const recordRepo = new MaintenanceRecordRepository(this.dataSource);
    const maintenanceRecordRepo =
      this.dataSource.getRepository(MaintenanceRecord);
    const assignedMaintenanceRepo =
      this.dataSource.getRepository(AssignedMaintenance);
    const userRepo = this.dataSource.getRepository(User);
    return new MaintenanceRecordsService(
      recordRepo,
      maintenanceRecordRepo,
      assignedMaintenanceRepo,
      userRepo,
    );
  }

  createVehiclesService(): VehiclesService {
    const vehicleRepo = new VehicleRepository(this.dataSource);
    const responsiblesService = this.createVehicleResponsiblesService();
    const vehicleModelRepo = this.dataSource.getRepository(VehicleModel);
    return new VehiclesService(
      vehicleRepo,
      responsiblesService,
      vehicleModelRepo,
    );
  }

  // Add more service factory methods here as we refactor them
}
