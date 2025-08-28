import "reflect-metadata";
import { DataSource } from "typeorm";
import {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} from "./config/env.config";

// Entities will be added here progressively
import { Vehicle } from "./entities/Vehicle";
import { User } from "./entities/User";
import { Assignment } from "./entities/Assignment";
import { Reservation } from "./entities/Reservation";
import { VehicleKilometers } from "./entities/VehicleKilometers";
import { MaintenanceCategory } from "./entities/MaintenanceCategory";
import { Maintenance } from "./entities/Maintenance";
import { AssignedMaintenance } from "./entities/AssignedMaintenance";
import { MaintenanceRecord } from "./entities/MaintenanceRecord";
import { VehicleResponsible } from "./entities/VehicleResponsible";

export const AppDataSource = new DataSource({
  type: "mssql",
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: true, // NOTE: for dev only. For prod use migrations.
  logging: false,
  options: { encrypt: false },
  entities: [
    Vehicle,
    User,
    Assignment,
    Reservation,
    VehicleKilometers,
    MaintenanceCategory,
    Maintenance,
    AssignedMaintenance,
    MaintenanceRecord,
    VehicleResponsible,
  ],
});

AppDataSource.initialize()
  .then(() => console.log("✅ SQL Server connection established (TypeORM)"))
  .catch((err: unknown) =>
    console.error("❌ SQL Server connection failed:", err),
  );

// Legacy raw query helpers removed after full migration to TypeORM repositories.
