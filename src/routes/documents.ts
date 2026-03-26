import { Router } from "express";
import { DocumentsController } from "@/controllers/documentsController";
import { validateUUIDParam } from "@/middleware/validation";
import { requireRole } from "@/middleware/permission";
import { UserRoleEnum } from "@/enums/UserRoleEnum";

const router = Router();

const documentsController = new DocumentsController();

// Document Types endpoints
router.get(
  "/types",
  requireRole(UserRoleEnum.USER),
  documentsController.getDocumentTypes,
);

router.get(
  "/types/:entityType",
  requireRole(UserRoleEnum.USER),
  documentsController.getDocumentTypesByEntity,
);

// Special query endpoints (must come before /:id routes)
router.get(
  "/expiring",
  requireRole(UserRoleEnum.USER),
  documentsController.getExpiringDocuments,
);

router.get(
  "/expired",
  requireRole(UserRoleEnum.USER),
  documentsController.getExpiredDocuments,
);

router.get(
  "/missing",
  requireRole(UserRoleEnum.USER),
  documentsController.getMissingDocuments,
);

// Document CRUD endpoints
router.post(
  "/",
  requireRole(UserRoleEnum.USER),
  documentsController.uploadMiddleware,
  documentsController.uploadDocument,
);

router.get(
  "/",
  requireRole(UserRoleEnum.USER),
  documentsController.getDocuments,
);

router.get(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.USER),
  documentsController.getDocumentById,
);

router.get(
  "/:id/history",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.ADMIN),
  documentsController.getDocumentHistory,
);

router.get(
  "/:id/download",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.USER),
  documentsController.downloadDocument,
);

router.delete(
  "/:id",
  validateUUIDParam("id"),
  requireRole(UserRoleEnum.ADMIN),
  documentsController.deleteDocument,
);

export default router;
