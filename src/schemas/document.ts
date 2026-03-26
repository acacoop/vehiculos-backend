import { z } from "zod";
import { EntityTypeEnum, DocumentTypeEnum } from "@/enums";

// Schema for uploading a document
export const DocumentUploadSchema = z.object({
  documentTypeId: z.string().uuid("Invalid document type ID"),
  entityType: z.nativeEnum(EntityTypeEnum, {
    errorMap: () => ({ message: "Invalid entity type" }),
  }),
  entityId: z.string().min(1, "Entity ID is required"),
  startDate: z.string().date("Invalid start date format (YYYY-MM-DD)"),
  expirationDate: z
    .string()
    .date("Invalid expiration date format (YYYY-MM-DD)")
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(1000, "Notes exceed maximum length")
    .optional()
    .nullable(),
});

// Schema for querying documents
export const DocumentQuerySchema = z.object({
  entityType: z.nativeEnum(EntityTypeEnum).optional(),
  entityId: z.string().optional(),
  documentTypeId: z.string().uuid().optional(),
  isCurrentVersion: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  isActive: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

// Schema for missing documents query
export const MissingDocumentsQuerySchema = z.object({
  entityType: z.nativeEnum(EntityTypeEnum, {
    errorMap: () => ({ message: "Entity type is required" }),
  }),
  entityId: z.string().min(1, "Entity ID is required"),
});

// Schema for expiring documents query
export const ExpiringDocumentsQuerySchema = z.object({
  days: z.coerce.number().min(1).max(365).default(30),
});

// Schema for entity type route parameter
export const EntityTypeParamSchema = z.object({
  entityType: z.nativeEnum(EntityTypeEnum, {
    errorMap: () => ({ message: "Invalid entity type" }),
  }),
});

export type DocumentUploadInput = z.infer<typeof DocumentUploadSchema>;
export type DocumentQuery = z.infer<typeof DocumentQuerySchema>;
export type MissingDocumentsQuery = z.infer<typeof MissingDocumentsQuerySchema>;
export type EntityTypeParam = z.infer<typeof EntityTypeParamSchema>;
export type ExpiringDocumentsQuery = z.infer<
  typeof ExpiringDocumentsQuerySchema
>;
