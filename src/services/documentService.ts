import { AppDataSource } from "@/db";
import { Document } from "@/entities/Document";
import { DocumentType } from "@/entities/DocumentType";
import { User } from "@/entities/User";
import { Vehicle } from "@/entities/Vehicle";
import { Assignment } from "@/entities/Assignment";
import { EntityTypeEnum, DocumentTypeEnum, PermissionType } from "@/enums";
import { AppError } from "@/middleware/errorHandler";
import { DocumentRepository } from "@/repositories/DocumentRepository";
import { DocumentTypeRepository } from "@/repositories/DocumentTypeRepository";
import { StorageProviderFactory } from "./storage/StorageProviderFactory";
import { DOCUMENT_MAX_FILE_SIZE_MB } from "@/config/env.config";
import { IsNull } from "typeorm";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

export interface DocumentUploadData {
  documentTypeId: string;
  entityType: EntityTypeEnum;
  entityId: string;
  startDate: string;
  expirationDate?: string | null;
  notes?: string | null;
  file?: {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
  };
}

export interface DocumentOutput {
  id: string;
  documentType: {
    id: string;
    code: DocumentTypeEnum;
    name: string;
    hasExpiration: boolean;
  };
  entityType: EntityTypeEnum;
  entityId: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  uploadedAt: Date;
  startDate: string;
  expirationDate: string | null;
  filePath: string | null;
  hasFile: boolean;
  isCurrentVersion: boolean;
  notes: string | null;
  status: "valid" | "expiring_soon" | "expired";
  daysUntilExpiration: number | null;
}

export interface MissingDocumentInfo {
  documentType: DocumentTypeEnum;
  name: string;
  reason: string;
}

export class DocumentService {
  private readonly repo: DocumentRepository;
  private readonly documentTypeRepo: DocumentTypeRepository;
  private readonly storageProvider = StorageProviderFactory.getProvider();

  constructor(
    repo?: DocumentRepository,
    documentTypeRepo?: DocumentTypeRepository,
  ) {
    this.repo = repo ?? new DocumentRepository(AppDataSource);
    this.documentTypeRepo =
      documentTypeRepo ?? new DocumentTypeRepository(AppDataSource);
  }

  /**
   * Upload a document for an entity
   */
  async uploadDocument(
    data: DocumentUploadData,
    uploadedBy: User,
  ): Promise<DocumentOutput> {
    // Validate document type exists
    const documentType = await this.documentTypeRepo.findOne(
      data.documentTypeId,
    );
    if (!documentType) {
      throw new AppError("Document type not found", 404);
    }

    // Validate entity exists
    await this.validateEntityExists(data.entityType, data.entityId);

    // Validate file if required
    if (documentType.requiresFile && !data.file) {
      throw new AppError(
        `Document type ${documentType.name} requires a file`,
        400,
      );
    }

    // Validate file size
    if (data.file) {
      const maxSizeBytes = DOCUMENT_MAX_FILE_SIZE_MB * 1024 * 1024;
      if (data.file.size > maxSizeBytes) {
        throw new AppError(
          `File size exceeds maximum allowed ${DOCUMENT_MAX_FILE_SIZE_MB}MB`,
          400,
        );
      }

      // Validate file type (whitelist)
      const allowedMimeTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      if (!allowedMimeTypes.includes(data.file.mimeType)) {
        throw new AppError(
          `File type ${data.file.mimeType} not allowed. Allowed types: ${allowedMimeTypes.join(", ")}`,
          400,
        );
      }
    }

    // Check if there's a current version of this document
    const existingDocument = await this.repo.findCurrentByEntityAndType(
      data.entityType,
      data.entityId,
      documentType.code,
    );

    // Upload file if provided
    let filePath: string | null = null;
    if (data.file) {
      const extension = path.extname(data.file.originalName);
      const filename = `${uuidv4()}${extension}`;
      const relativePath = path.join(
        data.entityType,
        data.entityId,
        documentType.code,
        filename,
      );

      filePath = await this.storageProvider.upload(
        data.file.buffer,
        relativePath,
        data.file.mimeType,
      );
    }

    // Create new document
    const document = this.repo.create({
      documentType,
      entityType: data.entityType,
      entityId: data.entityId,
      uploadedBy,
      startDate: data.startDate,
      expirationDate: data.expirationDate || null,
      filePath,
      notes: data.notes || null,
      isCurrentVersion: true,
      isActive: true,
    });

    const savedDocument = await this.repo.save(document);

    // Mark previous version as historical if exists
    if (existingDocument) {
      existingDocument.isCurrentVersion = false;
      existingDocument.replacedBy = savedDocument;
      await this.repo.save(existingDocument);
    }

    return this.mapDocumentToOutput(savedDocument);
  }

  /**
   * Get current documents for an entity
   */
  async getCurrentDocuments(
    entityType: EntityTypeEnum,
    entityId: string,
  ): Promise<DocumentOutput[]> {
    const documents = await this.repo.findCurrentByEntity(entityType, entityId);
    return documents.map((d) => this.mapDocumentToOutput(d));
  }

  /**
   * Get document by ID
   */
  async getDocumentById(id: string): Promise<DocumentOutput | null> {
    const document = await this.repo.findOne(id);
    return document ? this.mapDocumentToOutput(document) : null;
  }

  /**
   * Get document history (all versions) for a specific entity and document type
   */
  async getDocumentHistory(
    entityType: EntityTypeEnum,
    entityId: string,
    documentTypeCode: DocumentTypeEnum,
  ): Promise<DocumentOutput[]> {
    const documents = await this.repo.findHistoricalVersions(
      entityType,
      entityId,
      documentTypeCode,
    );
    return documents.map((d) => this.mapDocumentToOutput(d));
  }

  /**
   * Get documents expiring soon
   */
  async getExpiringSoon(daysAhead: number = 30): Promise<DocumentOutput[]> {
    const documents = await this.repo.findExpiringDocuments(daysAhead);
    return documents.map((d) => this.mapDocumentToOutput(d));
  }

  /**
   * Get expired documents
   */
  async getExpiredDocuments(): Promise<DocumentOutput[]> {
    const documents = await this.repo.findExpiredDocuments();
    return documents.map((d) => this.mapDocumentToOutput(d));
  }

  /**
   * Download document file
   */
  async downloadDocument(documentId: string): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }> {
    const document = await this.repo.findOne(documentId);
    if (!document) {
      throw new AppError("Document not found", 404);
    }

    if (!document.filePath) {
      throw new AppError("Document has no associated file", 404);
    }

    const buffer = await this.storageProvider.download(document.filePath);
    const filename = path.basename(document.filePath);

    // Determine MIME type from file extension
    const ext = path.extname(filename).toLowerCase();
    let mimeType = "application/octet-stream";
    if (ext === ".pdf") mimeType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
    else if (ext === ".png") mimeType = "image/png";

    return { buffer, filename, mimeType };
  }

  /**
   * Get missing required documents for an entity
   * BUSINESS LOGIC: Hardcoded rules for required documents
   */
  async getMissingDocuments(
    entityType: EntityTypeEnum,
    entityId: string,
  ): Promise<MissingDocumentInfo[]> {
    // Get existing documents
    const existingDocs = await this.getCurrentDocuments(entityType, entityId);
    const existingTypes = existingDocs.map((d) => d.documentType.code);

    const missing: MissingDocumentInfo[] = [];

    if (entityType === EntityTypeEnum.USER) {
      // DNI: Always required for users
      if (!existingTypes.includes(DocumentTypeEnum.DNI)) {
        const docType = await this.documentTypeRepo.findByCode(
          DocumentTypeEnum.DNI,
        );
        missing.push({
          documentType: DocumentTypeEnum.DNI,
          name: docType?.name || "DNI",
          reason: "Documento de identidad obligatorio para todos los usuarios",
        });
      }

      // LICENSE: Not mandatory (removed from required documents)
      // Users can optionally upload their license, but it's not enforced
    }

    if (entityType === EntityTypeEnum.VEHICLE) {
      const isActive = await this.checkIfVehicleIsActive(entityId);

      if (isActive) {
        // VTV: Required for active vehicles
        if (!existingTypes.includes(DocumentTypeEnum.VTV)) {
          const docType = await this.documentTypeRepo.findByCode(
            DocumentTypeEnum.VTV,
          );
          missing.push({
            documentType: DocumentTypeEnum.VTV,
            name: docType?.name || "VTV",
            reason: "Verificación técnica obligatoria para vehículos activos",
          });
        }

        // INSURANCE: Required for active vehicles
        if (!existingTypes.includes(DocumentTypeEnum.INSURANCE)) {
          const docType = await this.documentTypeRepo.findByCode(
            DocumentTypeEnum.INSURANCE,
          );
          missing.push({
            documentType: DocumentTypeEnum.INSURANCE,
            name: docType?.name || "Seguro",
            reason: "Seguro obligatorio para vehículos activos",
          });
        }
      }
    }

    // MAINTENANCE_RECORD: All documents are optional
    if (entityType === EntityTypeEnum.MAINTENANCE_RECORD) {
      return [];
    }

    return missing;
  }

  /**
   * Soft delete a document (mark as inactive)
   */
  async deleteDocument(documentId: string): Promise<void> {
    const document = await this.repo.findOne(documentId);
    if (!document) {
      throw new AppError("Document not found", 404);
    }

    document.isActive = false;
    await this.repo.save(document);
  }

  // Helper methods

  private async checkIfUserIsActiveDriver(userId: string): Promise<boolean> {
    const assignmentRepo = AppDataSource.getRepository(Assignment);

    // Find active assignments for this user
    const activeAssignments = await assignmentRepo.find({
      where: {
        user: { id: userId },
        endDate: IsNull(),
      },
      relations: ["vehicle"],
    });

    // For now, we consider any user with an active assignment as a driver
    // In the future, this could check VehicleACL permissions
    return activeAssignments.length > 0;
  }

  private async checkIfVehicleIsActive(vehicleId: string): Promise<boolean> {
    const assignmentRepo = AppDataSource.getRepository(Assignment);

    // A vehicle is active if it has at least one assignment without end date
    const count = await assignmentRepo.count({
      where: {
        vehicle: { id: vehicleId },
        endDate: IsNull(),
      },
    });

    return count > 0;
  }

  private async validateEntityExists(
    entityType: EntityTypeEnum,
    entityId: string,
  ): Promise<void> {
    let exists = false;

    switch (entityType) {
      case EntityTypeEnum.USER:
        exists = !!(await AppDataSource.getRepository(User).findOne({
          where: { id: entityId },
        }));
        break;
      case EntityTypeEnum.VEHICLE:
        exists = !!(await AppDataSource.getRepository(Vehicle).findOne({
          where: { id: entityId },
        }));
        break;
      // Add other entity types as needed
      default:
        // For now, assume it exists
        exists = true;
    }

    if (!exists) {
      throw new AppError(`${entityType} with ID ${entityId} not found`, 404);
    }
  }

  private mapDocumentToOutput(document: Document): DocumentOutput {
    const status = this.getDocumentStatus(document.expirationDate);
    const daysUntilExpiration = document.expirationDate
      ? this.calculateDaysUntilExpiration(document.expirationDate)
      : null;

    return {
      id: document.id,
      documentType: {
        id: document.documentType.id,
        code: document.documentType.code,
        name: document.documentType.name,
        hasExpiration: document.documentType.hasExpiration,
      },
      entityType: document.entityType,
      entityId: document.entityId,
      uploadedBy: document.uploadedBy
        ? {
            id: document.uploadedBy.id,
            firstName: document.uploadedBy.firstName,
            lastName: document.uploadedBy.lastName,
            email: document.uploadedBy.email,
          }
        : null,
      uploadedAt: document.uploadedAt,
      startDate: document.startDate,
      expirationDate: document.expirationDate,
      filePath: document.filePath,
      hasFile: !!document.filePath,
      isCurrentVersion: document.isCurrentVersion,
      notes: document.notes,
      status,
      daysUntilExpiration,
    };
  }

  private getDocumentStatus(
    expirationDate: string | null,
  ): "valid" | "expiring_soon" | "expired" {
    if (!expirationDate) return "valid";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "expired";
    if (diffDays <= 30) return "expiring_soon";
    return "valid";
  }

  private calculateDaysUntilExpiration(expirationDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
