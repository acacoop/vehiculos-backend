import "reflect-metadata";
import { DataSource } from "typeorm";
import sql from "mssql";
import {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_LOGGING,
  SQL_AAD_CONNECTION_STRING,
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

const isProd = (process.env.NODE_ENV || "").toLowerCase() === "production";

// Create DataSource configuration based on available connection options
const createDataSourceConfig = () => {
  if (SQL_AAD_CONNECTION_STRING) {
    return {
      type: "mssql" as const,
      connectionString: SQL_AAD_CONNECTION_STRING,
      synchronize: !isProd,
      logging: DB_LOGGING,
      options: { 
        encrypt: true, 
        trustServerCertificate: false
      },
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
    };
  }

  return {
    type: "mssql" as const,
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    synchronize: !isProd,
    logging: DB_LOGGING,
    options: { 
      encrypt: true, 
      trustServerCertificate: !isProd
    },
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
  };
};

export const AppDataSource = new DataSource(createDataSourceConfig());

// Ensure target database exists (dev convenience). Skips if cannot connect to master.
async function ensureDatabase(retries = 3, delayMs = 2000) {
  const masterConfig: sql.config = {
    user: DB_USER,
    password: DB_PASSWORD,
    server: DB_HOST,
    port: DB_PORT,
    database: "master",
    options: { encrypt: false, trustServerCertificate: true },
  } as sql.config;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const pool = await sql.connect(masterConfig);
      const dbs = await pool
        .request()
        .query<{ name: string }>("SELECT name FROM sys.databases;");
      const exists = dbs.recordset.some((r) => r.name === DB_NAME);
      if (!exists) {
        console.log(`ℹ️  Creating database '${DB_NAME}' (attempt ${attempt})`);
        await pool.request().query(`CREATE DATABASE [${DB_NAME}]`);
        console.log(`✅ Database '${DB_NAME}' created`);
      } else if (attempt === 1) {
        console.log(`ℹ️  Database '${DB_NAME}' already exists`);
      }
      await pool.close();
      return;
    } catch (e: unknown) {
      const err = e as {
        code?: string;
        originalError?: { info?: { number?: string }; message?: string };
        message?: string;
      };
      const code = err?.code || err?.originalError?.info?.number;
      const msg = err?.message || err?.originalError?.message || "";
      if (code === "ESOCKET" || code === "ECONNREFUSED") {
        console.log(
          `⏳ SQL Server not reachable yet (attempt ${attempt}/${retries}) code=${code}. Waiting ${delayMs}ms...`,
        );
      } else {
        console.log(
          `⚠️  DB ensure attempt ${attempt}/${retries} failed (code=${code}) ${msg}. Retrying in ${delayMs}ms...`,
        );
      }
      if (attempt === retries) {
        console.warn(
          "⚠️  Exhausted retries ensuring database; continuing anyway",
        );
        return;
      }
      await new Promise((res) => setTimeout(res, delayMs));
    } finally {
      // pool closed above on success
    }
  }
}

(async () => {
  if (!SQL_AAD_CONNECTION_STRING) {
    await ensureDatabase();
  }
  
  AppDataSource.initialize()
    .then(() => console.log("✅ SQL Server connection established (TypeORM)"))
    .catch((err: unknown) =>
      console.error("❌ SQL Server connection failed:", err),
    );
})();
