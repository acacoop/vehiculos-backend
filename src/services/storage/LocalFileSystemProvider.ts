import * as fs from "fs/promises";
import * as path from "path";
import { IFileStorageProvider } from "./IFileStorageProvider";
import { DOCUMENTS_BASE_PATH } from "../../config/env.config";

export class LocalFileSystemProvider implements IFileStorageProvider {
  private basePath: string;

  constructor(basePath?: string) {
    this.basePath = basePath || DOCUMENTS_BASE_PATH;
  }

  async upload(
    file: Buffer,
    filePath: string,
    mimeType: string,
  ): Promise<string> {
    const fullPath = path.join(this.basePath, filePath);
    const directory = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(directory, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, file);

    return filePath;
  }

  async download(filePath: string): Promise<Buffer> {
    const fullPath = path.join(this.basePath, filePath);
    return await fs.readFile(fullPath);
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, filePath);
    await fs.unlink(fullPath);
  }

  async getUrl(filePath: string): Promise<string> {
    // For local filesystem, return a relative path
    // The actual download will be handled by the API endpoint
    return `/api/documents/download/${encodeURIComponent(filePath)}`;
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
