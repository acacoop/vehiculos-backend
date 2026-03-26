import { Response } from "express";
import { asyncHandler, AppError } from "@/middleware/errorHandler";
import { AuthenticatedRequest } from "@/middleware/auth";
import { DocumentService } from "@/services/documentService";
import { DocumentTypeRepository } from "@/repositories/DocumentTypeRepository";
import { AppDataSource } from "@/db";
import { User } from "@/entities/User";
import {
  DocumentUploadSchema,
  DocumentQuerySchema,
  MissingDocumentsQuerySchema,
  ExpiringDocumentsQuerySchema,
  EntityTypeParamSchema,
} from "@/schemas/document";
import multer from "multer";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB (matches DOCUMENT_MAX_FILE_SIZE_MB)
  },
});

export class DocumentsController {
  private readonly service: DocumentService;
  private readonly documentTypeRepo: DocumentTypeRepository;

  // Multer middleware for file upload
  public uploadMiddleware = upload.single("file");

  constructor(service?: DocumentService) {
    this.service = service ?? new DocumentService();
    this.documentTypeRepo = new DocumentTypeRepository(AppDataSource);
  }

  /**
   * POST /documents
   * Upload a new document
   */
  public uploadDocument = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      // Fetch full user entity
      const userRepo = AppDataSource.getRepository(User);
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Validate request body
      const validatedData = DocumentUploadSchema.parse(req.body);

      // Handle file upload
      const file = req.file;
      const documentData = {
        ...validatedData,
        file: file
          ? {
              buffer: file.buffer,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
            }
          : undefined,
      };

      const document = await this.service.uploadDocument(documentData, user);

      res.status(201).json({
        status: "success",
        data: document,
        message: "Document uploaded successfully",
      });
    },
  );

  /**
   * GET /documents
   * Get documents with filters
   */
  public getDocuments = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const filters = DocumentQuerySchema.parse(req.query);

      if (filters.entityType && filters.entityId) {
        const documents = await this.service.getCurrentDocuments(
          filters.entityType,
          filters.entityId,
        );

        res.json({
          status: "success",
          data: documents,
          total: documents.length,
        });
      } else {
        // If no specific entity, return empty for now
        // Could be extended to support general filtering
        res.json({
          status: "success",
          data: [],
          total: 0,
        });
      }
    },
  );

  /**
   * GET /documents/:id
   * Get a specific document by ID
   */
  public getDocumentById = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const document = await this.service.getDocumentById(id);

      if (!document) {
        throw new AppError("Document not found", 404);
      }

      res.json({
        status: "success",
        data: document,
      });
    },
  );

  /**
   * GET /documents/:id/history
   * Get version history of a document (admin only via route middleware)
   */
  public getDocumentHistory = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      // First get the document to know its entity and type
      const document = await this.service.getDocumentById(id);
      if (!document) {
        throw new AppError("Document not found", 404);
      }

      const history = await this.service.getDocumentHistory(
        document.entityType,
        document.entityId,
        document.documentType.code,
      );

      res.json({
        status: "success",
        data: history,
        total: history.length,
      });
    },
  );

  /**
   * GET /documents/:id/download
   * Download a document file
   */
  public downloadDocument = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      const { buffer, filename, mimeType } =
        await this.service.downloadDocument(id);

      res.setHeader("Content-Type", mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );
      res.send(buffer);
    },
  );

  /**
   * GET /documents/expiring
   * Get documents expiring soon
   */
  public getExpiringDocuments = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { days } = ExpiringDocumentsQuerySchema.parse(req.query);

      const documents = await this.service.getExpiringSoon(days);

      res.json({
        status: "success",
        data: documents,
        total: documents.length,
      });
    },
  );

  /**
   * GET /documents/expired
   * Get expired documents
   */
  public getExpiredDocuments = asyncHandler(
    async (_req: AuthenticatedRequest, res: Response) => {
      const documents = await this.service.getExpiredDocuments();

      res.json({
        status: "success",
        data: documents,
        total: documents.length,
      });
    },
  );

  /**
   * GET /documents/missing
   * Get missing required documents for an entity
   */
  public getMissingDocuments = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { entityType, entityId } = MissingDocumentsQuerySchema.parse(
        req.query,
      );

      const missing = await this.service.getMissingDocuments(
        entityType,
        entityId,
      );

      res.json({
        status: "success",
        data: missing,
        total: missing.length,
      });
    },
  );

  /**
   * DELETE /documents/:id
   * Soft delete a document (admin only via route middleware)
   */
  public deleteDocument = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;

      await this.service.deleteDocument(id);

      res.json({
        status: "success",
        message: "Document deleted successfully",
      });
    },
  );

  /**
   * GET /document-types
   * Get all available document types
   */
  public getDocumentTypes = asyncHandler(
    async (_req: AuthenticatedRequest, res: Response) => {
      const types = await this.documentTypeRepo.findAll();

      res.json({
        status: "success",
        data: types,
        total: types.length,
      });
    },
  );

  /**
   * GET /document-types/:entityType
   * Get document types for a specific entity type
   */
  public getDocumentTypesByEntity = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { entityType } = EntityTypeParamSchema.parse(req.params);

      const types = await this.documentTypeRepo.findByEntityType(entityType);

      res.json({
        status: "success",
        data: types,
        total: types.length,
      });
    },
  );
}
