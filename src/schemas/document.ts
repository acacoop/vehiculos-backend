import { z } from "zod";

export const entityTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
});

export const documentTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  entity_type_id: z.string().uuid(),
});

export const documentTypeFileSchema = z.object({
  id: z.string().uuid(),
  document_type_id: z.string().uuid(),
  name: z.string().min(1).max(200),
});

export const documentSchema = z.object({
  id: z.string().uuid(),
  document_type_id: z.string().uuid(),
  entity_id: z.string().uuid(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const documentFileSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  document_type_file_id: z.string().uuid(),
  stored_filename: z.string().min(1),
  file_path: z.string().min(1),
  mime_type: z.string().min(1),
  file_size: z.number().positive(),
  version: z.number().positive(),
  is_current: z.boolean(),
  upload_date: z.date(),
  checksum: z.string().min(1),
});

export const createDocumentSchema = z.object({
  document_type_id: z.string().uuid(),
  entity_id: z.string().uuid(),
});

export const uploadFileSchema = z.object({
  document_id: z.string().uuid(),
  document_type_file_id: z.string().uuid(),
});

export type EntityType = z.infer<typeof entityTypeSchema>;
export type DocumentType = z.infer<typeof documentTypeSchema>;
export type DocumentTypeFile = z.infer<typeof documentTypeFileSchema>;
export type Document = z.infer<typeof documentSchema>;
export type DocumentFile = z.infer<typeof documentFileSchema>;
export type CreateDocument = z.infer<typeof createDocumentSchema>;
export type UploadFile = z.infer<typeof uploadFileSchema>;
