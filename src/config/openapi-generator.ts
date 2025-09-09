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
import { MaintenanceCategorySchema } from "../schemas/maintenance/category";
import { MaintenanceSchema } from "../schemas/maintenance/maintenance";
import {
  AssignedMaintenanceSchema,
  UpdateAssignedMaintenanceSchema,
} from "../schemas/maintenance/assignMaintance";
import { MaintenanceRecordSchema } from "../schemas/maintenance/maintanceRecord";

// Basic schema converter (subset)
// Simple converter (internal use) – returns loosely typed JSON schema fragments
const toSchema = (schema: z.ZodTypeAny): Record<string, unknown> => {
  const d = schema._def;
  switch (d.typeName) {
    case z.ZodFirstPartyTypeKind.ZodObject: {
      const shape: Record<string, unknown> = {};
      const req: string[] = [];
      const entries = Object.entries(d.shape()) as [string, z.ZodTypeAny][];
      for (const [k, v] of entries) {
        shape[k] = toSchema(v);
        // Detect optional/nullable via _def
        const isOptional =
          (v as any)._def?.typeName === z.ZodFirstPartyTypeKind.ZodOptional; // eslint-disable-line @typescript-eslint/no-explicit-any
        const isNullable =
          (v as any)._def?.typeName === z.ZodFirstPartyTypeKind.ZodNullable; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!isOptional && !isNullable) req.push(k);
      }
      return {
        type: "object",
        properties: shape,
        required: req.length ? req : undefined,
      };
    }
    case z.ZodFirstPartyTypeKind.ZodString:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((d.checks || []).some((c: any) => c.kind === "uuid"))
        return { type: "string", format: "uuid" };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((d.checks || []).some((c: any) => c.kind === "email"))
        return { type: "string", format: "email" };
      return { type: "string" };
    case z.ZodFirstPartyTypeKind.ZodNumber:
      return { type: "number" };
    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return { type: "boolean" };
    case z.ZodFirstPartyTypeKind.ZodDate:
      return { type: "string", format: "date-time" };
    case z.ZodFirstPartyTypeKind.ZodArray:
      return { type: "array", items: toSchema(d.type) };
    case z.ZodFirstPartyTypeKind.ZodOptional:
      return toSchema(d.innerType);
    case z.ZodFirstPartyTypeKind.ZodNullable:
      return { anyOf: [toSchema(d.innerType), { type: "null" }] };
    case z.ZodFirstPartyTypeKind.ZodEffects:
      return toSchema(d.schema);
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
