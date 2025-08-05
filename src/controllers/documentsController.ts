import { Request, Response } from "express";
import multer from "multer";
import { BaseController } from "./baseController";
import { DocumentsService } from "../services/documentsService";
import { FileStorageService } from "../services/fileStorageService";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { createDocumentSchema, uploadFileSchema } from "../schemas/document";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError("Tipo de archivo no permitido", 400));
    }
  },
});

export class DocumentsController extends BaseController {
  private documentsService: DocumentsService;
  private fileStorageService: FileStorageService;

  constructor() {
    super("documents");
    this.documentsService = new DocumentsService();
    this.fileStorageService = new FileStorageService();
  }

  getEntityTypes = asyncHandler(async (req: Request, res: Response) => {
    const entityTypes = await this.documentsService.getEntityTypes();
    return this.sendResponse(res, entityTypes, "Tipos de entidad obtenidos exitosamente");
  });

  getDocumentTypesByEntity = asyncHandler(async (req: Request, res: Response) => {
    const { entityType } = req.params;
    
    if (!entityType) {
      throw new AppError("Tipo de entidad requerido", 400);
    }

    const documentTypes = await this.documentsService.getDocumentTypesByEntity(entityType);
    return this.sendResponse(res, documentTypes, "Tipos de documento obtenidos exitosamente");
  });

  getDocumentTypeFiles = asyncHandler(async (req: Request, res: Response) => {
    const { documentTypeId } = req.params;
    
    if (!this.isValidUUID(documentTypeId)) {
      throw new AppError("ID de tipo de documento inválido", 400);
    }

    const files = await this.documentsService.getDocumentTypeFiles(documentTypeId);
    return this.sendResponse(res, files, "Archivos requeridos obtenidos exitosamente");
  });

  createDocument = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createDocumentSchema.parse(req.body);
    
    const document = await this.documentsService.createDocument(
      validatedData.document_type_id,
      validatedData.entity_id
    );
    
    return this.sendResponse(res, document, "Documento creado exitosamente", 201);
  });

  getDocument = asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params;
    
    if (!this.isValidUUID(documentId)) {
      throw new AppError("ID de documento inválido", 400);
    }

    const document = await this.documentsService.getDocumentById(documentId);
    
    if (!document) {
      throw new AppError("Documento no encontrado", 404);
    }

    return this.sendResponse(res, document, "Documento obtenido exitosamente");
  });

  getDocumentsByEntity = asyncHandler(async (req: Request, res: Response) => {
    const { entityId } = req.params;
    
    if (!this.isValidUUID(entityId)) {
      throw new AppError("ID de entidad inválido", 400);
    }

    const documents = await this.documentsService.getDocumentsByEntity(entityId);
    return this.sendResponse(res, documents, "Documentos obtenidos exitosamente");
  });

  uploadFile = [
    upload.single("file"),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.file) {
        throw new AppError("Archivo requerido", 400);
      }

      const { document_id, document_type_file_id } = req.body;
      const validatedData = uploadFileSchema.parse({ document_id, document_type_file_id });

      const document = await this.documentsService.getDocumentById(validatedData.document_id);
      if (!document) {
        throw new AppError("Documento no encontrado", 404);
      }

      const documentTypeFile = await this.documentsService.getDocumentTypeFiles(document.document_type_id);
      const fileType = documentTypeFile.find(f => f.id === validatedData.document_type_file_id);
      
      if (!fileType) {
        throw new AppError("Tipo de archivo no válido para este documento", 400);
      }

      // Get entity type name from entity_types table or use a simple mapping
      const entityTypeNames: Record<string, string> = {
        user: "User",
        vehicle: "Vehicle"
      };
      
      const entityTypeName = entityTypeNames[document.document_type.entity_type_id] || "Unknown";
      
      const nextVersion = document.files.filter(f => 
        f.document_type_file_id === validatedData.document_type_file_id
      ).length + 1;

      const storageResult = await this.fileStorageService.storeFile(
        req.file.buffer,
        req.file.originalname,
        entityTypeName,
        document.entity_id,
        document.document_type.name,
        fileType.name,
        nextVersion
      );

      const documentFile = await this.documentsService.addFileToDocument(
        validatedData.document_id,
        validatedData.document_type_file_id,
        storageResult.storedFilename,
        storageResult.filePath,
        req.file.mimetype,
        req.file.size,
        storageResult.checksum
      );

      return this.sendResponse(res, documentFile, "Archivo subido exitosamente", 201);
    })
  ];

  downloadFile = asyncHandler(async (req: Request, res: Response) => {
    const { fileId } = req.params;
    
    if (!this.isValidUUID(fileId)) {
      throw new AppError("ID de archivo inválido", 400);
    }

    const documentFile = await this.documentsService.getDocumentFile(fileId);
    
    if (!documentFile) {
      throw new AppError("Archivo no encontrado", 404);
    }

    if (!await this.fileStorageService.fileExists(documentFile.file_path)) {
      throw new AppError("Archivo físico no encontrado", 404);
    }

    const fileBuffer = await this.fileStorageService.retrieveFile(documentFile.file_path);
    
    res.setHeader("Content-Type", documentFile.mime_type);
    res.setHeader("Content-Length", documentFile.file_size);
    res.setHeader(
      "Content-Disposition", 
      `attachment; filename="${documentFile.stored_filename}"`
    );
    
    res.send(fileBuffer);
  });

  deleteDocument = asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params;
    
    if (!this.isValidUUID(documentId)) {
      throw new AppError("ID de documento inválido", 400);
    }

    const document = await this.documentsService.getDocumentById(documentId);
    
    if (!document) {
      throw new AppError("Documento no encontrado", 404);
    }

    for (const file of document.files) {
      try {
        await this.fileStorageService.deleteFile(file.file_path);
      } catch (_error) {
        console.warn(`No se pudo eliminar archivo físico: ${file.file_path}`);
      }
    }

    await this.documentsService.deleteDocument(documentId);
    
    return this.sendResponse(res, null, "Documento eliminado exitosamente");
  });
}
