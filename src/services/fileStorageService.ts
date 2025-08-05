import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { DOCUMENTS_STORAGE_PATH } from "../config/env.config";

export class FileStorageService {
  private storagePath: string;

  constructor() {
    this.storagePath = DOCUMENTS_STORAGE_PATH;
  }

  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  generateStorageFilename(originalFilename: string, version: number): string {
    const ext = path.extname(originalFilename);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString("hex");
    return `v${version}_${timestamp}_${random}${ext}`;
  }

  buildFilePath(entityName: string, entityId: string, documentTypeName: string, fileTypeName: string): string {
    const sanitizedEntityName = this.sanitizePath(entityName);
    const sanitizedDocumentType = this.sanitizePath(documentTypeName);
    const sanitizedFileType = this.sanitizePath(fileTypeName);
    
    return path.join(
      this.storagePath,
      sanitizedEntityName,
      entityId,
      sanitizedDocumentType,
      sanitizedFileType
    );
  }

  private sanitizePath(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  }

  async storeFile(
    buffer: Buffer,
    originalFilename: string,
    entityName: string,
    entityId: string,
    documentTypeName: string,
    fileTypeName: string,
    version: number
  ): Promise<{ storedFilename: string; filePath: string; checksum: string }> {
    const directoryPath = this.buildFilePath(entityName, entityId, documentTypeName, fileTypeName);
    await this.ensureDirectoryExists(directoryPath);

    const storedFilename = this.generateStorageFilename(originalFilename, version);
    const fullFilePath = path.join(directoryPath, storedFilename);
    const relativePath = path.relative(this.storagePath, fullFilePath);

    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");

    await fs.writeFile(fullFilePath, buffer);

    return {
      storedFilename,
      filePath: relativePath,
      checksum,
    };
  }

  async retrieveFile(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.storagePath, filePath);
    return await fs.readFile(fullPath);
  }

  async deleteFile(filePath: string): Promise<void> {
    const fullPath = path.join(this.storagePath, filePath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.storagePath, filePath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  getFullPath(filePath: string): string {
    return path.join(this.storagePath, filePath);
  }
}
