import { Document } from "@/entities/Document";
import { EntityTypeEnum, DocumentTypeEnum } from "@/enums";
import { RepositoryFindOptions } from "@/repositories/interfaces/common";

export interface DocumentFilters {
  entityType?: EntityTypeEnum;
  entityId?: string;
  documentTypeId?: string;
  isCurrentVersion?: boolean;
  isActive?: boolean;
  uploadedById?: string;
}

export interface IDocumentRepository {
  findAndCount(
    options?: RepositoryFindOptions<DocumentFilters>,
  ): Promise<[Document[], number]>;
  findOne(id: string): Promise<Document | null>;
  create(data: Partial<Document>): Document;
  save(entity: Document): Promise<Document>;

  /**
   * Find current (active) documents for a specific entity
   */
  findCurrentByEntity(
    entityType: EntityTypeEnum,
    entityId: string,
  ): Promise<Document[]>;

  /**
   * Find a specific current document by entity and document type
   */
  findCurrentByEntityAndType(
    entityType: EntityTypeEnum,
    entityId: string,
    documentTypeCode: DocumentTypeEnum,
  ): Promise<Document | null>;

  /**
   * Find all versions (including historical) for a specific entity and document type
   */
  findHistoricalVersions(
    entityType: EntityTypeEnum,
    entityId: string,
    documentTypeCode: DocumentTypeEnum,
  ): Promise<Document[]>;

  /**
   * Find documents expiring within a certain number of days
   */
  findExpiringDocuments(daysAhead: number): Promise<Document[]>;

  /**
   * Find documents that are already expired
   */
  findExpiredDocuments(): Promise<Document[]>;
}
