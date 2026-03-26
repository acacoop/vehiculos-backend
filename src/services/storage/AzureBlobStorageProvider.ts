import { IFileStorageProvider } from "./IFileStorageProvider";

/**
 * Azure Blob Storage provider (stub implementation)
 * TODO: Implement when Azure integration is ready
 */
export class AzureBlobStorageProvider implements IFileStorageProvider {
  async upload(
    file: Buffer,
    filePath: string,
    mimeType: string,
  ): Promise<string> {
    throw new Error("Azure Blob Storage provider not implemented yet");
  }

  async download(filePath: string): Promise<Buffer> {
    throw new Error("Azure Blob Storage provider not implemented yet");
  }

  async delete(filePath: string): Promise<void> {
    throw new Error("Azure Blob Storage provider not implemented yet");
  }

  async getUrl(filePath: string): Promise<string> {
    throw new Error("Azure Blob Storage provider not implemented yet");
  }

  async exists(filePath: string): Promise<boolean> {
    throw new Error("Azure Blob Storage provider not implemented yet");
  }
}
