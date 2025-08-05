import { some, oneOrNone } from "../db";
import {
  EntityType,
  DocumentType,
  DocumentTypeFile,
  Document,
  DocumentFile,
  DocumentWithFiles,
  DocumentFileWithDetails,
} from "../interfaces/document";
import { Pool } from "pg";
import {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} from "../config/env.config";

interface FileDbResult {
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
  file_type_name: string;
}

const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

export class DocumentsService {
  async getEntityTypes(): Promise<EntityType[]> {
    const query = "SELECT id, name FROM entity_types ORDER BY name";
    const result = await pool.query(query);
    return result.rows;
  }

  async getDocumentTypesByEntity(entityTypeName: string): Promise<DocumentType[]> {
    const query = `
      SELECT dt.id, dt.name, dt.entity_type_id 
      FROM document_types dt
      JOIN entity_types et ON dt.entity_type_id = et.id
      WHERE et.name = $1
      ORDER BY dt.name
    `;
    const result = await pool.query(query, [entityTypeName]);
    return result.rows;
  }

  async getDocumentTypeFiles(documentTypeId: string): Promise<DocumentTypeFile[]> {
    const query = `
      SELECT id, document_type_id, name 
      FROM document_type_files 
      WHERE document_type_id = $1
      ORDER BY name
    `;
    const result = await pool.query(query, [documentTypeId]);
    return result.rows;
  }

  async createDocument(documentTypeId: string, entityId: string): Promise<Document> {
    const query = `
      INSERT INTO documents (document_type_id, entity_id)
      VALUES ($1, $2)
      RETURNING id, document_type_id, entity_id, created_at, updated_at
    `;
    const result = await pool.query(query, [documentTypeId, entityId]);
    return result.rows[0];
  }

  async getDocumentById(documentId: string): Promise<DocumentWithFiles | null> {
    const documentQuery = `
      SELECT d.id, d.document_type_id, d.entity_id, d.created_at, d.updated_at,
             dt.name as document_type_name, dt.entity_type_id,
             et.name as entity_type_name
      FROM documents d
      JOIN document_types dt ON d.document_type_id = dt.id
      JOIN entity_types et ON dt.entity_type_id = et.id
      WHERE d.id = $1
    `;
    const documentResult = await pool.query(documentQuery, [documentId]);
    
    if (documentResult.rows.length === 0) return null;

    const document = documentResult.rows[0];
    
    const filesQuery = `
      SELECT df.id, df.document_id, df.document_type_file_id, df.stored_filename,
             df.file_path, df.mime_type, df.file_size, df.version, df.is_current,
             df.upload_date, df.checksum,
             dtf.name as file_type_name
      FROM document_files df
      JOIN document_type_files dtf ON df.document_type_file_id = dtf.id
      WHERE df.document_id = $1 AND df.is_current = true
      ORDER BY dtf.name
    `;
    const filesResult = await pool.query(filesQuery, [documentId]);

    return {
      id: document.id,
      document_type_id: document.document_type_id,
      entity_id: document.entity_id,
      created_at: document.created_at,
      updated_at: document.updated_at,
      document_type: {
        id: document.document_type_id,
        name: document.document_type_name,
        entity_type_id: document.entity_type_id,
      },
      files: filesResult.rows.map((file: FileDbResult) => ({
        id: file.id,
        document_id: file.document_id,
        document_type_file_id: file.document_type_file_id,
        stored_filename: file.stored_filename,
        file_path: file.file_path,
        mime_type: file.mime_type,
        file_size: file.file_size,
        version: file.version,
        is_current: file.is_current,
        upload_date: file.upload_date,
        checksum: file.checksum,
        document_type_file: {
          id: file.document_type_file_id,
          document_type_id: document.document_type_id,
          name: file.file_type_name,
        },
      })),
    };
  }

  async getDocumentsByEntity(entityId: string): Promise<DocumentWithFiles[]> {
    const documentsQuery = `
      SELECT d.id, d.document_type_id, d.entity_id, d.created_at, d.updated_at,
             dt.name as document_type_name, dt.entity_type_id
      FROM documents d
      JOIN document_types dt ON d.document_type_id = dt.id
      WHERE d.entity_id = $1
      ORDER BY dt.name
    `;
    const documentsResult = await pool.query(documentsQuery, [entityId]);

    const documents: DocumentWithFiles[] = [];

    for (const doc of documentsResult.rows) {
      const filesQuery = `
        SELECT df.id, df.document_id, df.document_type_file_id, df.stored_filename,
               df.file_path, df.mime_type, df.file_size, df.version, df.is_current,
               df.upload_date, df.checksum,
               dtf.name as file_type_name
        FROM document_files df
        JOIN document_type_files dtf ON df.document_type_file_id = dtf.id
        WHERE df.document_id = $1 AND df.is_current = true
        ORDER BY dtf.name
      `;
      const filesResult = await pool.query(filesQuery, [doc.id]);

      documents.push({
        id: doc.id,
        document_type_id: doc.document_type_id,
        entity_id: doc.entity_id,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        document_type: {
          id: doc.document_type_id,
          name: doc.document_type_name,
          entity_type_id: doc.entity_type_id,
        },
        files: filesResult.rows.map((file: FileDbResult) => ({
          id: file.id,
          document_id: file.document_id,
          document_type_file_id: file.document_type_file_id,
          stored_filename: file.stored_filename,
          file_path: file.file_path,
          mime_type: file.mime_type,
          file_size: file.file_size,
          version: file.version,
          is_current: file.is_current,
          upload_date: file.upload_date,
          checksum: file.checksum,
          document_type_file: {
            id: file.document_type_file_id,
            document_type_id: doc.document_type_id,
            name: file.file_type_name,
          },
        })),
      });
    }

    return documents;
  }

  async addFileToDocument(
    documentId: string,
    documentTypeFileId: string,
    storedFilename: string,
    filePath: string,
    mimeType: string,
    fileSize: number,
    checksum: string
  ): Promise<DocumentFile> {
    await pool.query("BEGIN");

    try {
      await pool.query(
        `UPDATE document_files 
         SET is_current = false 
         WHERE document_id = $1 AND document_type_file_id = $2`,
        [documentId, documentTypeFileId]
      );

      const versionQuery = `
        SELECT COALESCE(MAX(version), 0) + 1 as next_version
        FROM document_files
        WHERE document_id = $1 AND document_type_file_id = $2
      `;
      const versionResult = await pool.query(versionQuery, [documentId, documentTypeFileId]);
      const version = versionResult.rows[0].next_version;

      const insertQuery = `
        INSERT INTO document_files (
          document_id, document_type_file_id, stored_filename, file_path,
          mime_type, file_size, version, is_current, checksum
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
        RETURNING id, document_id, document_type_file_id, stored_filename,
                  file_path, mime_type, file_size, version, is_current,
                  upload_date, checksum
      `;
      const result = await pool.query(insertQuery, [
        documentId,
        documentTypeFileId,
        storedFilename,
        filePath,
        mimeType,
        fileSize,
        version,
        checksum,
      ]);

      await pool.query(
        "UPDATE documents SET updated_at = NOW() WHERE id = $1",
        [documentId]
      );

      await pool.query("COMMIT");
      return result.rows[0];
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }

  async getDocumentFile(fileId: string): Promise<DocumentFileWithDetails | null> {
    const query = `
      SELECT df.id, df.document_id, df.document_type_file_id, df.stored_filename,
             df.file_path, df.mime_type, df.file_size, df.version, df.is_current,
             df.upload_date, df.checksum,
             dtf.name as file_type_name, dtf.document_type_id
      FROM document_files df
      JOIN document_type_files dtf ON df.document_type_file_id = dtf.id
      WHERE df.id = $1
    `;
    const result = await pool.query(query, [fileId]);
    
    if (result.rows.length === 0) return null;

    const file = result.rows[0];
    return {
      id: file.id,
      document_id: file.document_id,
      document_type_file_id: file.document_type_file_id,
      stored_filename: file.stored_filename,
      file_path: file.file_path,
      mime_type: file.mime_type,
      file_size: file.file_size,
      version: file.version,
      is_current: file.is_current,
      upload_date: file.upload_date,
      checksum: file.checksum,
      document_type_file: {
        id: file.document_type_file_id,
        document_type_id: file.document_type_id,
        name: file.file_type_name,
      },
    };
  }

  async deleteDocument(documentId: string): Promise<void> {
    await pool.query("BEGIN");

    try {
      await pool.query("DELETE FROM document_files WHERE document_id = $1", [documentId]);
      await pool.query("DELETE FROM documents WHERE id = $1", [documentId]);
      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }
}
