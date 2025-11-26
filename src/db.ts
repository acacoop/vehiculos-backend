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
} from "@/config/env.config";

// Entities will be added here progressively
import { Vehicle } from "@/entities/Vehicle";
import { User } from "@/entities/User";
import { Assignment } from "@/entities/Assignment";
import { Reservation } from "@/entities/Reservation";
import { VehicleKilometers } from "@/entities/VehicleKilometers";
import { MaintenanceCategory } from "@/entities/MaintenanceCategory";
import { Maintenance } from "@/entities/Maintenance";
import { MaintenanceRequirement } from "@/entities/MaintenanceRequirement";
import { MaintenanceRecord } from "@/entities/MaintenanceRecord";
import { VehicleResponsible } from "@/entities/VehicleResponsible";
import { VehicleBrand } from "@/entities/VehicleBrand";
import { VehicleModel } from "@/entities/VehicleModel";
import { VehicleACL } from "@/entities/VehicleACL";
import { UserRole } from "@/entities/UserRole";
import { MaintenanceChecklist } from "@/entities/MaintenanceChecklist";
import { MaintenanceChecklistItem } from "@/entities/MaintenanceChecklistItem";

// Determine if running from dist folder
// In tests, NODE_ENV is usually 'test' and we're always in src/
// In production builds, files are compiled to dist/
// Check if we're in a built environment by testing if dist directory structure exists
const isProd = (process.env.NODE_ENV || "").toLowerCase() === "production";
const isTest = (process.env.NODE_ENV || "").toLowerCase() === "test";
const isRunningFromDist = isProd && !isTest;

function parseConnectionString(connStr: string) {
  const params: Record<string, string> = {};
  connStr.split(";").forEach((pair) => {
    const [k, v] = pair.split("=");
    if (k && v) params[k.toLowerCase()] = v;
  });
  const server = params.server?.replace(/^tcp:/i, "").split(",")[0];
  const port = Number(params.server?.split(",")[1] || 1433);
  return {
    server,
    port,
    database: params.database,
    encrypt: String(params.encrypt).toLowerCase() === "true",
    trustServerCertificate:
      String(params.trustservercertificate).toLowerCase() === "true",
  };
}

const createDataSourceConfig = () => {
  const baseConfig = {
    type: "mssql" as const,
    logging: DB_LOGGING,
    entities: [
      Vehicle,
      User,
      Assignment,
      Reservation,
      VehicleKilometers,
      MaintenanceCategory,
      Maintenance,
      MaintenanceRequirement,
      MaintenanceRecord,
      VehicleResponsible,
      VehicleBrand,
      VehicleModel,
      VehicleACL,
      UserRole,
      MaintenanceChecklist,
      MaintenanceChecklistItem,
    ],
    migrations: isRunningFromDist
      ? ["dist/migrations/*.js"]
      : ["src/migrations/*.ts"],
    migrationsRun: true,
    synchronize: false,
    migrationsTableName: "migrations",
  };

  if (SQL_AAD_CONNECTION_STRING) {
    const c = parseConnectionString(SQL_AAD_CONNECTION_STRING);
    return {
      ...baseConfig,
      host: c.server,
      port: c.port,
      database: c.database,
      options: {
        encrypt: c.encrypt,
        trustServerCertificate: c.trustServerCertificate,
      },
      extra: {
        authentication: {
          type: "azure-active-directory-msi-app-service",
        },
      },
    };
  }

  // Fallback local con SQL auth
  return {
    ...baseConfig,
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    options: {
      encrypt: true,
      trustServerCertificate: !isProd,
    },
  };
};

export const AppDataSource = new DataSource(createDataSourceConfig());

// Ensure target database exists (dev convenience). Only for local SQL auth.
async function ensureDatabase(retries = 3, delayMs = 2000) {
  if (SQL_AAD_CONNECTION_STRING) {
    return;
  }

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
        console.log(`ℹ️ Creating database '${DB_NAME}' (attempt ${attempt})`);
        await pool.request().query(`CREATE DATABASE [${DB_NAME}]`);
        console.log(`✅ Database '${DB_NAME}' created`);
      } else if (attempt === 1) {
        console.log(`ℹ️ Database '${DB_NAME}' already exists`);
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

// Export the initialization function for manual control
export async function initializeDatabase() {
  if (!process.env.JEST_WORKER_ID) {
    await ensureDatabase();
    await AppDataSource.initialize();
  }
}

// Auto-initialize only if explicitly requested (for backwards compatibility)
// The main app (index.ts) will call initializeDatabase() manually
if (process.env.AUTO_INIT_DB === "true" && !process.env.JEST_WORKER_ID) {
  (async () => {
    await ensureDatabase();

    AppDataSource.initialize()
      .then(() => {
        console.log("✅ SQL Server connection established (TypeORM)");
      })
      .catch((err: unknown) =>
        console.error("❌ SQL Server connection failed:", err),
      );
  })();
}
