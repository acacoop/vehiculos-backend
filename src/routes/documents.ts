import { Router } from "express";
import { DocumentsController } from "../controllers/documentsController";
import { validateSchema } from "../middleware/errorHandler";
import { validateId } from "../middleware/validation";
import { createDocumentSchema } from "../schemas/document";

const router = Router();
const documentsController = new DocumentsController();

// GET /documents/entity-types - Get all entity types
router.get("/entity-types", documentsController.getEntityTypes);

// GET /documents/entity-types/:entityType/document-types - Get document types by entity
router.get("/entity-types/:entityType/document-types", documentsController.getDocumentTypesByEntity);

// GET /documents/document-types/:documentTypeId/files - Get required files for document type
router.get("/document-types/:documentTypeId/files", documentsController.getDocumentTypeFiles);

// POST /documents - Create new document
router.post("/", validateSchema(createDocumentSchema), documentsController.createDocument);

// GET /documents/:documentId - Get document by ID with files
router.get("/:documentId", validateId, documentsController.getDocument);

// GET /documents/entity/:entityId - Get all documents for an entity
router.get("/entity/:entityId", validateId, documentsController.getDocumentsByEntity);

// POST /documents/:documentId/files - Upload file to document
router.post("/:documentId/files", documentsController.uploadFile);

// GET /documents/files/:fileId/download - Download file
router.get("/files/:fileId/download", documentsController.downloadFile);

// DELETE /documents/:documentId - Delete document and all its files
router.delete("/:documentId", validateId, documentsController.deleteDocument);

export default router;
