export interface EntityType {
  id: string;
  name: string;
}

export interface DocumentType {
  id: string;
  name: string;
  entity_type_id: string;
}

export interface DocumentTypeFile {
  id: string;
  document_type_id: string;
  name: string;
}

export interface Document {
  id: string;
  document_type_id: string;
  entity_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentFile {
  id: string;
  document_id: string;
  document_type_file_id: string;
  stored_filename: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  version: number;
  is_current: boolean;
  upload_date: Date;
  checksum: string;
}

export interface DocumentWithFiles extends Document {
  document_type: DocumentType;
  files: DocumentFileWithDetails[];
}

export interface DocumentFileWithDetails extends DocumentFile {
  document_type_file: DocumentTypeFile;
}
