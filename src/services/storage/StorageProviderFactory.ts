import { IFileStorageProvider } from "./IFileStorageProvider";
import { LocalFileSystemProvider } from "./LocalFileSystemProvider";
import { AzureBlobStorageProvider } from "./AzureBlobStorageProvider";
import { FILE_STORAGE_PROVIDER } from "../../config/env.config";

export class StorageProviderFactory {
  private static instance: IFileStorageProvider | null = null;

  static getProvider(): IFileStorageProvider {
    if (!this.instance) {
      switch (FILE_STORAGE_PROVIDER) {
        case "local":
          this.instance = new LocalFileSystemProvider();
          break;
        case "azure":
          this.instance = new AzureBlobStorageProvider();
          break;
        default:
          throw new Error(`Unknown storage provider: ${FILE_STORAGE_PROVIDER}`);
      }
    }
    return this.instance;
  }

  // For testing purposes
  static setProvider(provider: IFileStorageProvider): void {
    this.instance = provider;
  }

  // Reset the singleton instance
  static reset(): void {
    this.instance = null;
  }
}
