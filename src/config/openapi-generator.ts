// Lightweight OpenAPI doc builder using Zod schemas (no external generator due to missing exports)
import { z } from "zod";
import { UserSchema } from "../schemas/user";
import { VehicleSchema } from "../schemas/vehicle";
import {
  AssignmentSchema,
  AssignmentUpdateSchema,
} from "../schemas/assignment";
import { ReservationSchema } from "../schemas/reservation";
import {
  VehicleKilometersLogSchema,
  VehicleKilometersLogCreateSchema,
} from "../schemas/vehicleKilometers";
import { MaintenanceCategorySchema } from "../schemas/maintenanceCategory";
import { MaintenanceSchema } from "../schemas/maintenance";
import {
  AssignedMaintenanceSchema,
  UpdateAssignedMaintenanceSchema,
} from "../schemas/assignMaintance";
import { MaintenanceRecordSchema } from "../schemas/maintenanceRecord";

// Type for Zod internal checks
interface ZodStringCheck {
  kind: string;
  [key: string]: unknown;
}

// Type for Zod internal _def structure
interface ZodInternalDef {
  typeName: z.ZodFirstPartyTypeKind;
  checks?: ZodStringCheck[];
  shape?: () => Record<string, z.ZodTypeAny>;
  type?: z.ZodTypeAny;
  innerType?: z.ZodTypeAny;
  schema?: z.ZodTypeAny;
  [key: string]: unknown;
}

// Basic schema converter (subset)
// Simple converter (internal use) – returns loosely typed JSON schema fragments
const toSchema = (schema: z.ZodTypeAny): Record<string, unknown> => {
  const d = schema._def as ZodInternalDef;
  switch (d.typeName) {
    case z.ZodFirstPartyTypeKind.ZodObject: {
      const shape: Record<string, unknown> = {};
      const req: string[] = [];
      if (d.shape) {
        const entries = Object.entries(d.shape()) as [string, z.ZodTypeAny][];
        for (const [k, v] of entries) {
          shape[k] = toSchema(v);
          // Detect optional/nullable via _def
          const vDef = v._def as ZodInternalDef;
          const isOptional =
            vDef?.typeName === z.ZodFirstPartyTypeKind.ZodOptional;
          const isNullable =
            vDef?.typeName === z.ZodFirstPartyTypeKind.ZodNullable;
          if (!isOptional && !isNullable) req.push(k);
        }
      }
      return {
        type: "object",
        properties: shape,
        required: req.length ? req : undefined,
      };
    }
    case z.ZodFirstPartyTypeKind.ZodString:
      if ((d.checks || []).some((c: ZodStringCheck) => c.kind === "uuid"))
        return { type: "string", format: "uuid" };
      if ((d.checks || []).some((c: ZodStringCheck) => c.kind === "email"))
        return { type: "string", format: "email" };
      return { type: "string" };
    case z.ZodFirstPartyTypeKind.ZodNumber:
      return { type: "number" };
    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return { type: "boolean" };
    case z.ZodFirstPartyTypeKind.ZodDate:
      return { type: "string", format: "date-time" };
    case z.ZodFirstPartyTypeKind.ZodArray:
      return d.type
        ? { type: "array", items: toSchema(d.type) }
        : { type: "array" };
    case z.ZodFirstPartyTypeKind.ZodOptional:
      return d.innerType ? toSchema(d.innerType) : { type: "string" };
    case z.ZodFirstPartyTypeKind.ZodNullable:
      return d.innerType
        ? { anyOf: [toSchema(d.innerType), { type: "null" }] }
        : { type: "null" };
    case z.ZodFirstPartyTypeKind.ZodEffects:
      return d.schema ? toSchema(d.schema) : { type: "string" };
    default:
      return { type: "string" };
  }
};

// ----- PATHS (core CRUD examples) -----
const schemas = {
  User: toSchema(UserSchema),
  Vehicle: toSchema(VehicleSchema),
  Assignment: toSchema(AssignmentSchema),
  AssignmentUpdate: toSchema(AssignmentUpdateSchema),
  Reservation: toSchema(ReservationSchema),
  VehicleKilometersLog: toSchema(VehicleKilometersLogSchema),
  VehicleKilometersLogCreate: toSchema(VehicleKilometersLogCreateSchema),
  MaintenanceCategory: toSchema(MaintenanceCategorySchema),
  Maintenance: toSchema(MaintenanceSchema),
  AssignedMaintenance: toSchema(AssignedMaintenanceSchema),
  AssignedMaintenanceUpdate: toSchema(UpdateAssignedMaintenanceSchema),
  MaintenanceRecord: toSchema(MaintenanceRecordSchema),
};

const uuidParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", format: "uuid" },
};

export function generateOpenApiDoc() {
  return {
    openapi: "3.0.3",
    info: { title: "Vehiculos API", version: "1.0.0" },
    servers: [{ url: "/api" }],
    tags: [
      { name: "users" },
      { name: "vehicles" },
      { name: "assignments" },
      { name: "reservations" },
      { name: "maintenance" },
    ],
    paths: {
      "/users": {
        get: {
          summary: "List users",
          responses: {
            "200": {
              description: "Users list",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/User" },
                  },
                },
              },
            },
          },
        },
      },
      "/users/{id}": {
        get: {
          summary: "Get user",
          parameters: [uuidParam],
          responses: {
            "200": {
              description: "User",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/User" },
                },
              },
            },
            "404": { description: "Not found" },
          },
        },
      },
      "/vehicles": {
        get: {
          summary: "List vehicles",
          responses: {
            "200": {
              description: "Vehicles list",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Vehicle" },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Create vehicle",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Vehicle" },
              },
            },
          },
          responses: {
            "201": {
              description: "Created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Vehicle" },
                },
              },
            },
          },
        },
      },
      "/assignments": {
        get: {
          summary: "List assignments",
          responses: {
            "200": {
              description: "Assignments list",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Assignment" },
                  },
                },
              },
            },
          },
        },
      },
      "/reservations": {
        get: {
          summary: "List reservations",
          responses: {
            "200": {
              description: "Reservations list",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Reservation" },
                  },
                },
              },
            },
          },
        },
      },
      "/vehicles/{id}/kilometers": {
        get: {
          summary: "List vehicle kilometers logs",
          parameters: [uuidParam],
          responses: {
            "200": {
              description: "Logs",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/VehicleKilometersLog",
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Add log",
          parameters: [uuidParam],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/VehicleKilometersLogCreate",
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/VehicleKilometersLog" },
                },
              },
            },
          },
        },
      },
      "/maintenance/categories": {
        get: {
          summary: "List maintenance categories",
          responses: {
            "200": {
              description: "Categories",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/MaintenanceCategory" },
                  },
                },
              },
            },
          },
        },
      },
      "/maintenance/records": {
        get: {
          summary: "List maintenance records",
          responses: {
            "200": {
              description: "Records",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/MaintenanceRecord" },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: { schemas },
  };
}
