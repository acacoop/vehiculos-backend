export interface IFileStorageProvider {
  /**
   * Upload a file to the storage
   * @param file Buffer containing the file data
   * @param filePath Relative path where the file should be stored
   * @param mimeType MIME type of the file
   * @returns The path where the file was stored
   */
  upload(file: Buffer, filePath: string, mimeType: string): Promise<string>;

  /**
   * Download a file from the storage
   * @param filePath Relative path of the file to download
   * @returns Buffer containing the file data
   */
  download(filePath: string): Promise<Buffer>;

  /**
   * Delete a file from the storage
   * @param filePath Relative path of the file to delete
   */
  delete(filePath: string): Promise<void>;

  /**
   * Get the URL to access a file
   * @param filePath Relative path of the file
   * @returns URL to access the file
   */
  getUrl(filePath: string): Promise<string>;

  /**
   * Check if a file exists
   * @param filePath Relative path of the file
   * @returns True if the file exists, false otherwise
   */
  exists(filePath: string): Promise<boolean>;
}
